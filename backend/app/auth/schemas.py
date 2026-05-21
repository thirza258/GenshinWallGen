from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TasksData(BaseModel):
    daily: List[Dict[str, Any]] = []
    weekly: List[Dict[str, Any]] = []
    notes: str = ""
    resolution: str = "1920x1080"