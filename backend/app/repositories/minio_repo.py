import json
from urllib.parse import urlparse
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, List

from minio import Minio
from minio.error import S3Error

from app.config import MinioConfig

class MinioRepository:
    def __init__(self):
        self.client = Minio(
            MinioConfig.ENDPOINT,
            access_key=MinioConfig.ACCESS_KEY,
            secret_key=MinioConfig.SECRET_KEY,
            secure=MinioConfig.SECURE,
        )
        self.bucket = MinioConfig.BUCKET
        self.prefix = MinioConfig.WALLPAPER_PREFIX
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                print(f"Bucket '{self.bucket}' created")
            # Set public read policy
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": ["*"]},
                        "Action": ["s3:GetObject"],
                        "Resource": f"arn:aws:s3:::{self.bucket}/*",
                    }
                ],
            }
            self.client.set_bucket_policy(self.bucket, json.dumps(policy))
            print("Public read policy applied")
        except S3Error as e:
            print(f"MinIO bucket setup error: {e}")

    def upload_wallpaper(self, local_file_path: Path, user_id: str) -> str:
        unique_id = uuid.uuid4().hex
        object_name = f"user_{user_id}/{unique_id}.png"
        self.client.fput_object(
            self.bucket,
            object_name,
            str(local_file_path),
            content_type="image/png",
        )
        public_base = MinioConfig.PUBLIC_URL.rstrip('/')
        return f"{public_base}/{self.bucket}/{object_name}"
    
    def extract_object_key_from_url(self, url: str) -> str:
        """Extract the object key from a public MinIO URL."""
        public_base = MinioConfig.PUBLIC_URL.rstrip('/')
        if not url.startswith(public_base):
            raise ValueError(f"URL does not start with public base: {url}")
        # Remove base and leading slash
        path = url[len(public_base):].lstrip('/')
        # Expected format: {bucket}/{object_key}
        parts = path.split('/', 1)
        if len(parts) != 2 or parts[0] != self.bucket:
            raise ValueError(f"Invalid URL format, expected bucket '{self.bucket}'")
        return parts[1]

        # In MinioRepository
    def get_latest_wallpaper_object_for_user(self, user_id: str = None):
        """Get the most recent object for a given user (or guest if user_id='guest')."""
        prefix = f"user_{user_id}/" if user_id else f"{self.prefix}/"
        objects = list(self.client.list_objects(self.bucket, prefix=prefix, recursive=True))
        if not objects:
            return None
        return max(objects, key=lambda obj: obj.last_modified)

    def download_latest_wallpaper_bytes_for_user(self, user_id: str = None) -> bytes:
        latest = self.get_latest_wallpaper_object_for_user(user_id)
        if not latest:
            raise FileNotFoundError(f"No wallpaper found for user '{user_id}'")
        response = self.client.get_object(self.bucket, latest.object_name)
        data = response.read()
        response.close()
        return data

    def get_latest_wallpaper_info_for_user(self, user_id: str = None):
        latest = self.get_latest_wallpaper_object_for_user(user_id)
        if not latest:
            return {"has_wallpaper": False, "last_modified": None}
        return {
            "has_wallpaper": True,
            "last_modified": latest.last_modified.isoformat(),
            "object_name": latest.object_name,
        }
        
    def get_file_info(self, key: str) -> dict:
        """Return metadata for a given object key."""
        stat = self.client.stat_object(self.bucket, key)
        return {
            "size": stat.size,
            "last_modified": stat.last_modified.isoformat()
        }
        
    def download_bytes(self, url: str) -> bytes:
        """Download file bytes from a public MinIO URL or raw object key."""
        # If it's a full public URL, extract the object key
        if url.startswith(MinioConfig.PUBLIC_URL.rstrip('/')):
            key = self.extract_object_key_from_url(url)
        else:
            # Assume it's already a key (fallback for compatibility)
            key = url

        response = self.client.get_object(self.bucket, key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()