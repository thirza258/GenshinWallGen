# WallCraft — Wallpaper Generator

A FastAPI + Pillow app to generate beautiful task-overlay desktop wallpapers.

## Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server
uvicorn main:app --reload --port 8000

# 3. Open in browser
# http://localhost:8000
```

## Project Structure

```
wallpaper-gen/
├── main.py              # FastAPI routes
├── wallpaper_gen.py     # Pillow image generation logic
├── requirements.txt
├── data/
│   └── tasks.json       # Task & config storage
├── static/
│   └── wallpaper.png    # Generated output
└── templates/
    └── index.html       # Frontend UI
```

## API Endpoints

| Method | Path           | Description                      |
|--------|----------------|----------------------------------|
| GET    | /              | Serve the UI                     |
| GET    | /api/tasks     | Get current tasks & settings     |
| POST   | /api/tasks     | Save tasks & settings            |
| POST   | /api/generate  | Generate wallpaper image         |
| GET    | /api/download  | Download the generated PNG       |
| GET    | /api/status    | Check if a wallpaper exists      |

## Background Themes

- **gradient** — smooth vertical colour gradient
- **abstract** — gradient + floating glowing circles + lines
- **mesh** — blurred blob mesh (great for soft, modern look)

## Auto-scheduling (optional)

Add to `main.py` to regenerate every hour:

```python
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.add_job(generate_wallpaper, 'interval', hours=1)
scheduler.start()
```

## Set as Desktop Wallpaper (optional)

After generating, call this from your system:

```python
# macOS
import subprocess
subprocess.run(["osascript", "-e",
  'tell app "Finder" to set desktop picture to POSIX file "/path/to/wallpaper.png"'])

# Windows
import ctypes
ctypes.windll.user32.SystemParametersInfoW(20, 0, r"C:\path\to\wallpaper.png", 3)

# Linux (GNOME)
subprocess.run(["gsettings", "set", "org.gnome.desktop.background", "picture-uri",
  "file:///path/to/wallpaper.png"])
```
