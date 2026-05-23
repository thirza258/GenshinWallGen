from pydantic import BaseModel
from typing import List
from app.database import Base
from sqlalchemy import Column, Integer, String, JSON

class UserImage(Base):

    __tablename__ = "user_images"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    image_url = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
    
class Task(BaseModel):
    id: str = ""
    text: str
    done: bool = False

class TasksPayload(BaseModel):
    daily: List[Task] = []
    weekly: List[Task] = []
    notes: str = ""
    resolution: str = "1920x1080"