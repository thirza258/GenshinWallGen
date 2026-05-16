"""
main.py — FastAPI app for the Wallpaper Generator
"""
import uuid
import time
from pathlib import Path
from datetime import datetime
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from wallpaper_gen import (
    generate_wallpaper,
    load_tasks,
    save_tasks,
    OUTPUT_DIR,
)

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="WallCraft", version="1.0.0")
app.mount("/static", StaticFiles(directory=str(OUTPUT_DIR)), name="static")

# ─── Models ──────────────────────────────────────────────────────────────────

class Task(BaseModel):
    id: str = ""
    text: str
    done: bool = False


class TasksPayload(BaseModel):
    daily: list[Task] = []
    weekly: list[Task] = []
    notes: str = ""
    theme: Literal["gradient", "abstract", "mesh"] = "gradient"
    resolution: str = "1920x1080"


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    html_file = Path(__file__).parent / "templates" / "index.html"
    return HTMLResponse(html_file.read_text())


@app.get("/api/tasks")
async def get_tasks():
    return load_tasks()


@app.post("/api/tasks")
async def update_tasks(payload: TasksPayload):
    data = payload.model_dump()
    # Assign IDs to tasks missing them
    for section in ("daily", "weekly"):
        for task in data[section]:
            if not task["id"]:
                task["id"] = str(uuid.uuid4())[:8]
    save_tasks(data)
    return {"status": "saved"}


@app.post("/api/generate")
async def generate():
    try:
        start = time.time()
        out = generate_wallpaper()
        elapsed = round(time.time() - start, 2)
        ts = datetime.now().isoformat()
        return {
            "status": "ok",
            "path": f"/static/wallpaper.png?t={int(time.time())}",
            "elapsed": elapsed,
            "generated_at": ts,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/download")
async def download():
    path = OUTPUT_DIR / "wallpaper.png"
    if not path.exists():
        raise HTTPException(status_code=404, detail="No wallpaper generated yet")
    return FileResponse(
        path,
        media_type="image/png",
        filename=f"wallpaper_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png",
    )


@app.get("/api/status")
async def status():
    path = OUTPUT_DIR / "wallpaper.png"
    return {
        "has_wallpaper": path.exists(),
        "last_modified": datetime.fromtimestamp(path.stat().st_mtime).isoformat() if path.exists() else None,
    }
