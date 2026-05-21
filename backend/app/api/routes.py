from pathlib import Path
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
import io
from sqlalchemy.orm import Session
from app.models.task import TasksPayload
from app.services.task_service import load_tasks, update_tasks
from app.services.generation import  generate_and_upload_for_user
from app.repositories.minio_repo import MinioRepository
from app.auth.dependencies import get_current_user, get_db
from app.auth.models import User

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def serve_ui():
    html_file = Path(__file__).parent.parent.parent / "templates" / "index.html"
    # Fallback if templates not found - adjust path as needed
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
async def generate(current_user: User = Depends(get_current_user)):
    try:
        # Pass the user's stored tasks data to the generator
        return generate_and_upload_for_user(current_user.tasks_data)
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
        from app.services.generation import generate_and_upload_for_user
        return generate_and_upload_for_user(tasks_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/download")
async def download():
    try:
        repo = MinioRepository()
        file_data = repo.download_latest_wallpaper_bytes()
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=wallpaper.png"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No wallpaper found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MinIO error: {e}")

@router.get("/api/status")
async def status():
    try:
        repo = MinioRepository()
        return repo.get_latest_wallpaper_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MinIO error: {e}")
    
@router.get("/api/wallpaper/latest")
async def get_latest_wallpaper():
    """Stream the most recently generated wallpaper (for preview)."""
    try:
        repo = MinioRepository()
        file_data = repo.download_latest_wallpaper_bytes()
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type="image/png",
            headers={"Cache-Control": "no-cache, must-revalidate"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No wallpaper found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MinIO error: {e}")