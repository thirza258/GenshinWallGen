from sqlalchemy import Column, ForeignKey, Integer, LargeBinary, String
from app.database import Base


class PixelProject(Base):
    __tablename__ = "pixel_projects"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    id = Column(String(36), primary_key=True)
    name = Column(String(100), nullable=False)
    mode = Column(String(20), nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    frame_count = Column(Integer, nullable=False)
    preview_frame = Column(Integer, nullable=False, default=0)
    document = Column(LargeBinary, nullable=False)
    preview = Column(LargeBinary, nullable=False)
    thumbnail = Column(LargeBinary, nullable=False)
    storage_bytes = Column(Integer, nullable=False)
    revision = Column(Integer, nullable=False)
    created_at = Column(String(40), nullable=False)
    updated_at = Column(String(40), nullable=False, index=True)
