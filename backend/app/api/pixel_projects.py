"""Authenticated autosaves; project documents and image results stay private."""

import base64
from datetime import datetime, timezone
import json
from uuid import UUID
import zlib

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, defer
from starlette.concurrency import run_in_threadpool

from app.auth.dependencies import get_current_user, get_db
from app.auth.models import User
from app.models.pixel import PixelProject
from app.services.pixel_projects import (
    MAX_ACCOUNT_BYTES,
    MAX_BODY_BYTES,
    MAX_PROJECTS,
    encode_snapshot,
)

router = APIRouter(prefix="/api/pixel/projects", tags=["pixel-projects"])


def projects(db, user_id):
    return db.query(PixelProject).filter(PixelProject.user_id == user_id)


def find_project(db, user_id, project_id):
    row = projects(db, user_id).filter(PixelProject.id == str(project_id)).first()
    if row is None:
        raise HTTPException(404, "Saved project not found.")
    return row


def summary(row):
    return {
        key: getattr(row, key)
        for key in (
            "id",
            "name",
            "mode",
            "width",
            "height",
            "frame_count",
            "preview_frame",
            "revision",
            "created_at",
            "updated_at",
        )
    }


def save_snapshot(payload, project_id, user_id, db):
    values = encode_snapshot(payload, project_id)
    existing = projects(db, user_id).filter(PixelProject.id == str(project_id)).first()
    if (
        existing
        and existing.document == values["document"]
        and existing.preview == values["preview"]
        and existing.preview_frame == values["preview_frame"]
    ):
        return summary(existing)
    if payload["revision"] != (existing.revision if existing else 0):
        raise HTTPException(
            409,
            "A newer account copy exists, or this project was deleted. Open Saved projects to recover it, or save your local work as a new copy.",
        )
    count, size = (
        db.query(
            func.count(PixelProject.id),
            func.coalesce(func.sum(PixelProject.storage_bytes), 0),
        )
        .filter(PixelProject.user_id == user_id)
        .one()
    )
    if (not existing and count >= MAX_PROJECTS) or size - (
        existing.storage_bytes if existing else 0
    ) + values["storage_bytes"] > MAX_ACCOUNT_BYTES:
        raise HTTPException(
            413, "Account storage is full. Remove an older saved project and try again."
        )
    now = datetime.now(timezone.utc).isoformat()
    values.update(updated_at=now, revision=payload["revision"] + 1)
    try:
        if existing:
            updated = (
                projects(db, user_id)
                .filter(
                    PixelProject.id == str(project_id),
                    PixelProject.revision == payload["revision"],
                )
                .update(values, synchronize_session=False)
            )
            if updated != 1:
                db.rollback()
                raise HTTPException(
                    409,
                    "This project changed during saving. Open the latest account copy before continuing.",
                )
        else:
            db.add(
                PixelProject(
                    id=str(project_id), user_id=user_id, created_at=now, **values
                )
            )
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            409,
            "This project was saved elsewhere. Open Saved projects to load the latest copy.",
        ) from error
    db.expire_all()
    return summary(find_project(db, user_id, project_id))


@router.put("/{project_id}")
async def autosave(
    project_id: UUID,
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    raw = bytearray()
    async for chunk in request.stream():
        if len(raw) + len(chunk) > MAX_BODY_BYTES:
            raise HTTPException(413, "Project upload exceeds 40 MB.")
        raw.extend(chunk)

    def invalid_constant(_value):
        raise ValueError("Non-finite number")

    try:
        payload = json.loads(raw, parse_constant=invalid_constant)
    except (ValueError, UnicodeDecodeError, RecursionError) as error:
        raise HTTPException(422, "Provide a valid JSON project snapshot.") from error
    return await run_in_threadpool(save_snapshot, payload, project_id, user.id, db)


@router.get("")
def list_projects(
    response: Response,
    offset: int = Query(0, ge=0),
    limit: int = Query(24, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    rows = (
        projects(db, user.id)
        .options(defer(PixelProject.document), defer(PixelProject.preview))
        .order_by(PixelProject.updated_at.desc(), PixelProject.id)
        .offset(offset)
        .limit(limit + 1)
        .all()
    )
    return {
        "projects": [
            {**summary(row), "thumbnail": base64.b64encode(row.thumbnail).decode()}
            for row in rows[:limit]
        ],
        "next_offset": offset + limit if len(rows) > limit else None,
    }


@router.get("/{project_id}")
def get_project(
    project_id: UUID,
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = find_project(db, user.id, project_id)
    response.headers["Cache-Control"] = "no-store"
    return {**summary(row), "project": json.loads(zlib.decompress(row.document))}


@router.get("/{project_id}/image")
def get_image(
    project_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = find_project(db, user.id, project_id)
    return Response(
        row.preview,
        media_type="image/png",
        headers={
            "Cache-Control": "private, no-store",
            "Content-Disposition": f'attachment; filename="{project_id}.png"',
        },
    )


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: UUID,
    revision: int = Query(..., ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    find_project(db, user.id, project_id)
    removed = (
        projects(db, user.id)
        .filter(PixelProject.id == str(project_id), PixelProject.revision == revision)
        .delete(synchronize_session=False)
    )
    if removed != 1:
        db.rollback()
        raise HTTPException(
            409, "This project changed. Refresh Saved projects before deleting it."
        )
    db.commit()
    return Response(status_code=204, headers={"Cache-Control": "no-store"})
