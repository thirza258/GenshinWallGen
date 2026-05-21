from sqlalchemy import Column, Integer, String, JSON
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Store user's tasks data as JSON (daily, weekly, notes, resolution)
    tasks_data = Column(JSON, default=dict)

    def __init__(self, username, hashed_password):
        self.username = username
        self.hashed_password = hashed_password
        self.tasks_data = {
            "daily": [],
            "weekly": [],
            "notes": "",
            "resolution": "1920x1080"
        }