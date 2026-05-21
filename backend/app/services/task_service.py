import json
from pathlib import Path
from typing import Dict, Any

from app.config import AppConfig
from app.models.task import TasksPayload

def load_tasks() -> Dict[str, Any]:
    tasks_file = Path(AppConfig.TASKS_FILE)
    if not tasks_file.exists():
        return {"daily": [], "weekly": [], "notes": "", "resolution": "1920x1080"}
    with open(tasks_file, "r") as f:
        return json.load(f)

def save_tasks(data: Dict[str, Any]) -> None:
    tasks_file = Path(AppConfig.TASKS_FILE)
    with open(tasks_file, "w") as f:
        json.dump(data, f, indent=2)

def update_tasks(payload: TasksPayload) -> None:
    data = payload.model_dump()
    for section in ("daily", "weekly"):
        for task in data[section]:
            if not task["id"]:
                task["id"] = str(uuid.uuid4())[:8]
    save_tasks(data)