"""Seed the persistent SQLite volume once, preserving an available legacy DB."""

import os
from pathlib import Path
import sqlite3


def prepare_database():
    url = os.getenv("DATABASE_URL", "")
    if not url.startswith("sqlite:////"):
        return
    destination = Path(url.removeprefix("sqlite:///"))
    source = Path(__file__).resolve().parent / "wallcraft.db"
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() or not source.exists() or destination == source:
        return
    # SQLite's backup API also includes committed data in a WAL file.
    with sqlite3.connect(source) as legacy, sqlite3.connect(destination) as persistent:
        legacy.backup(persistent)


if __name__ == "__main__":
    prepare_database()
