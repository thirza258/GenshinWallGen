import json
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

    def upload_wallpaper(self, local_file_path: Path) -> str:
        unique_id = uuid.uuid4().hex
        object_name = f"{self.prefix}/{unique_id}.png"
        self.client.fput_object(
            self.bucket,
            object_name,
            str(local_file_path),
            content_type="image/png",
        )
        public_base = MinioConfig.PUBLIC_URL.rstrip('/')
        return f"{public_base}/{self.bucket}/{object_name}"

    def get_latest_wallpaper_object(self):
        objects = list(self.client.list_objects(self.bucket, prefix=f"{self.prefix}/", recursive=True))
        if not objects:
            return None
        return max(objects, key=lambda obj: obj.last_modified)

    def download_latest_wallpaper_bytes(self) -> bytes:
        latest = self.get_latest_wallpaper_object()
        if not latest:
            raise FileNotFoundError("No wallpaper found")
        response = self.client.get_object(self.bucket, latest.object_name)
        data = response.read()
        response.close()
        return data

    def get_latest_wallpaper_info(self):
        latest = self.get_latest_wallpaper_object()
        if not latest:
            return {"has_wallpaper": False, "last_modified": None}
        return {
            "has_wallpaper": True,
            "last_modified": latest.last_modified.isoformat(),
        }