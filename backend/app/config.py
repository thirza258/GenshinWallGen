import os
from dotenv import load_dotenv

load_dotenv()

class MinioConfig:
    ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    PUBLIC_URL = os.getenv("MINIO_PUBLIC_URL", "http://localhost:9000")
    ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    BUCKET = os.getenv("MINIO_BUCKET", "wallpapers")
    SECURE = os.getenv("MINIO_SECURE", "False").lower() == "true"
    WALLPAPER_PREFIX = "wallpapers"

class AppConfig:
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://genshinwallpaper.nevatal.tech"
    ]
    TASKS_FILE = "tasks.json"