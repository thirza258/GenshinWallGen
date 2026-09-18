"""Real authenticated requests against isolated SQLite storage."""

import base64
from copy import deepcopy
from io import BytesIO
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from uuid import uuid4

os.environ.setdefault("SECRET_KEY", "pixel-studio-test-key-only")
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import pixel_projects
from app.auth.dependencies import get_db
from app.auth.models import User
from app.auth.utils import create_access_token
from app.database import Base
import bootstrap_database


def snapshot(project_id=None):
    project_id = project_id or str(uuid4())
    image = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    image.putpixel((0, 0), (0, 0, 0, 255))
    output = BytesIO()
    image.save(output, format="PNG")
    return {
        "revision": 0,
        "frame": 0,
        "preview_png": base64.b64encode(output.getvalue()).decode(),
        "project": {
            "id": project_id,
            "version": 1,
            "name": "My character",
            "mode": "sprite",
            "width": 16,
            "height": 16,
            "palette": ["#000000", "#ffffff"],
            "paletteName": "Test",
            "paletteLocked": True,
            "layers": [
                {
                    "id": "art",
                    "name": "Artwork",
                    "visible": True,
                    "locked": False,
                    "opacity": 1,
                    "ratio": 1,
                    "blend": "source-over",
                    "clip": False,
                }
            ],
            "frames": [
                {
                    "id": "frame",
                    "duration": 125,
                    "tag": "idle",
                    "pose": {},
                    "cels": {"art": {"pixels": [0] + [-1] * 255, "tiles": {}}},
                }
            ],
            "rig": [],
            "fps": 8,
            "interpolation": "stepped",
            "pixelSnap": True,
            "tileSize": 8,
            "tileRule": "47",
            "theme": "Grassland",
            "wrapX": False,
            "wrapY": False,
        },
    }


class PixelProjectTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
        )
        Base.metadata.create_all(self.engine)
        self.session = sessionmaker(bind=self.engine)
        with self.session() as db:
            db.add_all([User("alice", "unused"), User("bob", "unused")])
            db.commit()

        def isolated_db():
            with self.session() as db:
                yield db

        app = FastAPI()
        app.include_router(pixel_projects.router)
        app.dependency_overrides[get_db] = isolated_db
        self.client = TestClient(app)
        self.alice = {
            "Authorization": f"Bearer {create_access_token({'sub': 'alice'})}"
        }
        self.bob = {"Authorization": f"Bearer {create_access_token({'sub': 'bob'})}"}

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def save(self, payload, headers=None):
        return self.client.put(
            f"/api/pixel/projects/{payload['project']['id']}",
            content=json.dumps(payload),
            headers={"Content-Type": "application/json", **(headers or self.alice)},
        )

    def test_autosave_round_trip_image_thumbnail_and_idempotent_retry(self):
        payload = snapshot()
        response = self.save(payload)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["revision"], 1)
        self.assertEqual(self.save(payload).json()["revision"], 1)
        project_id = payload["project"]["id"]
        result = self.client.get(
            f"/api/pixel/projects/{project_id}", headers=self.alice
        )
        self.assertEqual(result.json()["project"], payload["project"])
        self.assertEqual(result.headers["cache-control"], "no-store")
        listing = self.client.get("/api/pixel/projects", headers=self.alice).json()
        self.assertEqual(len(listing["projects"]), 1)
        self.assertNotIn("project", listing["projects"][0])
        self.assertEqual(
            Image.open(
                BytesIO(base64.b64decode(listing["projects"][0]["thumbnail"]))
            ).size,
            (16, 16),
        )
        result = self.client.get(
            f"/api/pixel/projects/{project_id}/image", headers=self.alice
        )
        self.assertEqual(result.headers["content-type"], "image/png")
        image = Image.open(BytesIO(result.content))
        self.assertEqual(image.getpixel((0, 0)), (0, 0, 0, 255))
        self.assertEqual(image.getpixel((1, 1))[3], 0)

    def test_all_endpoints_require_authentication_and_scope_every_result_to_its_owner(
        self,
    ):
        payload = snapshot()
        project_id = payload["project"]["id"]
        self.save(payload)
        paths = ["", f"/{project_id}", f"/{project_id}/image"]
        for path in paths:
            self.assertEqual(
                self.client.get(f"/api/pixel/projects{path}").status_code, 401
            )
        self.assertEqual(
            self.client.put(
                f"/api/pixel/projects/{project_id}", json=payload
            ).status_code,
            401,
        )
        self.assertEqual(
            self.client.delete(
                f"/api/pixel/projects/{project_id}?revision=1"
            ).status_code,
            401,
        )
        self.assertEqual(
            self.client.get("/api/pixel/projects", headers=self.bob).json()["projects"],
            [],
        )
        for path in paths[1:]:
            self.assertEqual(
                self.client.get(
                    f"/api/pixel/projects{path}", headers=self.bob
                ).status_code,
                404,
            )
        self.assertEqual(
            self.client.delete(
                f"/api/pixel/projects/{project_id}?revision=1", headers=self.bob
            ).status_code,
            404,
        )
        payload["project"]["name"] = "Bob's separate copy"
        self.assertEqual(self.save(payload, self.bob).status_code, 200)
        self.assertEqual(
            self.client.get(
                f"/api/pixel/projects/{project_id}", headers=self.alice
            ).json()["name"],
            "My character",
        )

    def test_revisions_prevent_stale_writes_and_deleted_projects_do_not_reappear(self):
        payload = snapshot()
        project_id = payload["project"]["id"]
        self.save(payload)
        payload["project"]["name"] = "Edited"
        self.assertEqual(self.save(payload).status_code, 409)
        payload["revision"] = 1
        self.assertEqual(self.save(payload).json()["revision"], 2)
        self.assertEqual(
            self.client.delete(
                f"/api/pixel/projects/{project_id}?revision=1", headers=self.alice
            ).status_code,
            409,
        )
        self.assertEqual(
            self.client.delete(
                f"/api/pixel/projects/{project_id}?revision=2", headers=self.alice
            ).status_code,
            204,
        )
        self.assertEqual(
            self.client.get(
                f"/api/pixel/projects/{project_id}", headers=self.alice
            ).status_code,
            404,
        )
        self.assertEqual(self.save(payload).status_code, 409)

    def test_malformed_projects_and_previews_are_rejected_without_saving(self):
        original = snapshot()
        cases = []
        for key, value in [
            ("version", True),
            ("name", ""),
            ("name", "\ud800"),
            ("theme", "Unknown theme"),
            ("width", 513),
            ("palette", []),
            ("rig", [{}]),
            ("layers", []),
            ("paletteLocked", "yes"),
        ]:
            payload = deepcopy(original)
            payload["project"][key] = value
            cases.append(payload)
        payload = deepcopy(original)
        payload["project"]["frames"][0]["cels"]["art"]["pixels"][0] = 200
        cases.append(payload)
        payload = deepcopy(original)
        payload["preview_png"] = "bad PNG"
        cases.append(payload)
        payload = deepcopy(original)
        payload["project"]["width"] = 8
        payload["project"]["frames"][0]["cels"]["art"]["pixels"] = [-1] * 128
        cases.append(payload)
        payload = deepcopy(original)
        payload["frame"] = 1
        cases.append(payload)
        for payload in cases:
            response = self.save(payload)
            self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual(
            self.client.get("/api/pixel/projects", headers=self.alice).json()[
                "projects"
            ],
            [],
        )
        with patch.object(pixel_projects, "MAX_BODY_BYTES", 100):
            self.assertEqual(self.save(original).status_code, 413)

    def test_account_limits_and_pagination(self):
        with patch.object(pixel_projects, "MAX_PROJECTS", 2):
            first = snapshot()
            self.save(first)
            self.save(snapshot())
            self.assertEqual(self.save(snapshot()).status_code, 413)
            first["revision"] = 1
            first["project"]["name"] = "Still editable"
            self.assertEqual(self.save(first).status_code, 200)
        listing = self.client.get(
            "/api/pixel/projects?limit=1", headers=self.alice
        ).json()
        self.assertEqual(len(listing["projects"]), 1)
        self.assertEqual(listing["next_offset"], 1)
        self.assertIsNone(
            self.client.get(
                "/api/pixel/projects?limit=1&offset=1", headers=self.alice
            ).json()["next_offset"]
        )
        with patch.object(pixel_projects, "MAX_ACCOUNT_BYTES", 1):
            self.assertEqual(self.save(snapshot()).status_code, 413)


class PixelDatabaseTests(unittest.TestCase):
    def test_migrations_create_persistent_schema_and_can_be_repeated(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "persistent.db"
            env = {**os.environ, "DATABASE_URL": f"sqlite:///{target}"}
            for _ in range(2):
                result = subprocess.run(
                    [sys.executable, "-m", "alembic", "upgrade", "head"],
                    cwd=BACKEND,
                    env=env,
                    capture_output=True,
                    text=True,
                )
                self.assertEqual(result.returncode, 0, result.stderr)
            with sqlite3.connect(target) as db:
                self.assertEqual(
                    db.execute("SELECT version_num FROM alembic_version").fetchone()[0],
                    "91f2a38ce4b0",
                )
                self.assertIn(
                    "pixel_projects",
                    [
                        row[0]
                        for row in db.execute(
                            "SELECT name FROM sqlite_master WHERE type='table'"
                        )
                    ],
                )

    def test_bootstrap_copies_legacy_sqlite_once_without_overwriting_persistent_data(
        self,
    ):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "wallcraft.db"
            target = Path(folder) / "data" / "wallcraft.db"
            with sqlite3.connect(source) as db:
                db.execute("CREATE TABLE sample (value TEXT)")
                db.execute("INSERT INTO sample VALUES ('legacy')")
            with patch.object(
                bootstrap_database,
                "__file__",
                str(Path(folder) / "bootstrap_database.py"),
            ), patch.dict(os.environ, {"DATABASE_URL": f"sqlite:///{target}"}):
                bootstrap_database.prepare_database()
                with sqlite3.connect(target) as db:
                    self.assertEqual(
                        db.execute("SELECT value FROM sample").fetchone()[0], "legacy"
                    )
                    db.execute("UPDATE sample SET value='persisted'")
                bootstrap_database.prepare_database()
                with sqlite3.connect(target) as db:
                    self.assertEqual(
                        db.execute("SELECT value FROM sample").fetchone()[0],
                        "persisted",
                    )
