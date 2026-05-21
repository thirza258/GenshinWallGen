from pydantic import BaseModel
from typing import List

class Task(BaseModel):
    id: str = ""
    text: str
    done: bool = False

class TasksPayload(BaseModel):
    daily: List[Task] = []
    weekly: List[Task] = []
    notes: str = ""
    resolution: str = "1920x1080"