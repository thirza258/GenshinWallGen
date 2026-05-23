import sys
import time
from pathlib import Path
from datetime import datetime
from fastapi import HTTPException

backend_root = Path(__file__).parent.parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))


from wallpaper_gen import generate_wallpaper, OUTPUT_DIR
from app.repositories.minio_repo import MinioRepository

def generate_and_upload_for_user(tasks_data: dict, user_id: str = "anonymous") -> dict:
    start = time.time()
    
    # Pass user's tasks_data to the generator
    local_path = generate_wallpaper(tasks_data)   # returns Path to generated file
    if not local_path.exists():
        raise HTTPException(status_code=500, detail="Generation did not produce file")

    repo = MinioRepository()
    if user_id == "anonymous":
        user_id = "guest"
    public_url = repo.upload_wallpaper(local_path, user_id=user_id)

    # Cleanup local file
    local_path.unlink()

    elapsed = round(time.time() - start, 2)
    ts = datetime.now().isoformat()
    return {
        "status": "ok",
        "path": public_url, 
        "elapsed": elapsed,
        "generated_at": ts,
    }