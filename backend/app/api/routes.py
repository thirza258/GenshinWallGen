from datetime import datetime
from pathlib import Path
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
import io
from sqlalchemy.orm import Session
from app.models.task import TasksPayload, UserImage
from app.services.task_service import load_tasks, update_tasks
from app.services.generation import  generate_and_upload_for_user
from app.repositories.minio_repo import MinioRepository
from app.auth.dependencies import get_current_user, get_db
from app.auth.models import User
from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def serve_ui():
    html_file = Path(__file__).parent.parent.parent / "templates" / "index.html"
    if not html_file.exists():
        html_file = Path(__file__).parent.parent / "templates" / "index.html"
    return HTMLResponse(html_file.read_text())

@router.get("/api/tasks")
async def get_tasks(current_user: User = Depends(get_current_user)):
    return current_user.tasks_data

@router.post("/api/tasks")
async def update_tasks(
    payload: TasksPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure tasks have IDs
    data = payload.model_dump()
    for section in ("daily", "weekly"):
        for task in data[section]:
            if not task.get("id"):
                task["id"] = str(uuid.uuid4())[:8]
    current_user.tasks_data = data
    db.commit()
    return {"status": "saved"}

@router.post("/api/generate")
async def generate(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Pass the user's stored tasks data to the generator
        result = generate_and_upload_for_user(current_user.tasks_data, user_id=current_user.id)
        image_url = result["path"]
        user_image = UserImage(
                user_id=current_user.id,
                image_url=image_url,
                created_at=datetime.now(ZoneInfo("Asia/Jakarta")).isoformat()
            )
        db.add(user_image)
        db.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/api/anonymous/generate")
async def anonymous_generate(payload: TasksPayload):
    """
    Generate wallpaper for guest users.
    Accepts tasks data in request body, returns image URL.
    No authentication, no persistence.
    """
    try:
        tasks_data = payload.model_dump()
        # Ensure tasks have IDs (optional)
        for section in ("daily", "weekly"):
            for task in tasks_data[section]:
                if not task.get("id"):
                    task["id"] = str(uuid.uuid4())[:8]
        # Call generation service with provided data
        print(tasks_data)
        return generate_and_upload_for_user(tasks_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/anonymous/download")
async def anonymous_download():
    try:
        repo = MinioRepository()
        # Explicitly look for guest user's latest image
        file_data = repo.download_latest_wallpaper_bytes_for_user(user_id="guest")
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=wallpaper.png"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No wallpaper found for guest")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MinIO error: {e}")

@router.get("/api/anonymous/status")
async def anonymous_status():
    try:
        repo = MinioRepository()
        return repo.get_latest_wallpaper_info_for_user(user_id="guest")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MinIO error: {e}")
    
@router.get("/api/download")
async def download(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest_image = db.query(UserImage).filter(
        UserImage.user_id == current_user.id
    ).order_by(UserImage.created_at.desc()).first()
    
    if not latest_image:
        raise HTTPException(status_code=404, detail="No wallpaper found for this user")
    
    try:
        repo = MinioRepository()
        file_data = repo.download_bytes(latest_image.image_url)   # now works with URL
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=wallpaper.png"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Wallpaper file missing in storage")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MinIO error: {e}")
    
@router.get("/api/status")
async def status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest_image = db.query(UserImage).filter(
        UserImage.user_id == current_user.id
    ).order_by(UserImage.created_at.desc()).first()
    
    if not latest_image:
        return {"status": "no_wallpaper", "user_id": current_user.id}
    
    try:
        repo = MinioRepository()
        object_key = repo.extract_object_key_from_url(latest_image.image_url)
        info = repo.get_file_info(object_key)   # use new method
        return {
            "image_id": latest_image.id,
            "image_url": latest_image.image_url,
            "created_at": latest_image.created_at,
            "size": info.get("size"),
            "last_modified": info.get("last_modified")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MinIO error: {e}")
    
@router.get("/api/wallpaper/latest")
async def get_latest_wallpaper(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest_image = db.query(UserImage).filter(
        UserImage.user_id == current_user.id
    ).order_by(UserImage.created_at.desc()).first()
    
    if not latest_image:
        raise HTTPException(status_code=404, detail="No wallpaper found for this user")
    
    try:
        repo = MinioRepository()
        file_data = repo.download_bytes(latest_image.image_url)   # direct URL
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type="image/png",
            headers={"Cache-Control": "no-cache, must-revalidate"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Wallpaper file missing")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MinIO error: {e}")