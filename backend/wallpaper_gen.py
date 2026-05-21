"""
wallpaper_gen.py — Core image generation logic using Pillow
"""
import json
import math
import random
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path


def get_project_root() -> Path:
    current = Path(__file__).resolve()
    return current.parent.parent

PROJECT_ROOT = get_project_root()
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "static"
TASKS_FILE = DATA_DIR / "tasks.json"
WALLPAPER_SOURCE = PROJECT_ROOT / "source"

OUTPUT_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def load_tasks() -> dict:
    if TASKS_FILE.exists():
        return json.loads(TASKS_FILE.read_text())
    return {"daily": [], "weekly": [], "notes": ""}


def save_tasks(data: dict):
    TASKS_FILE.write_text(json.dumps(data, indent=2))


def parse_resolution(res: str) -> tuple[int, int]:
    try:
        w, h = res.lower().split("x")
        return int(w), int(h)
    except Exception:
        return 1920, 1080


def draw_rounded_rect(draw: ImageDraw.ImageDraw, xy, radius: int, fill, alpha: int = 180):
    """Draw a rounded rectangle on a transparent overlay."""
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(*fill, alpha))


def wrap_text(text: str, font, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    words = text.split()
    lines, current = [], ""
    for word in words:
        test = (current + " " + word).strip()
        if draw.textlength(test, font=font) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


# ─── Background Generators ───────────────────────────────────────────────────


def load_wallpaper_source(w: int, h: int) -> Image.Image:
    candidates = list(WALLPAPER_SOURCE.glob("*.jpg")) + list(WALLPAPER_SOURCE.glob("*.png"))
    if not candidates:
        return None
    path = random.choice(candidates)
    try:
        img = Image.open(path).convert("RGB")
        img = img.resize((w, h))
        return img
    except Exception:
        return None

# ─── Font Loading ─────────────────────────────────────────────────────────────

def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Try to load a system font, fall back to default."""
    candidates = []
    if bold:
        candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "C:/Windows/Fonts/arialbd.ttf",
        ]
    else:
        candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "C:/Windows/Fonts/arial.ttf",
        ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


# ─── Panel Rendering ──────────────────────────────────────────────────────────

PANEL_BG = (10, 10, 30)
TEXT_PRIMARY = (240, 240, 255)
TEXT_SECONDARY = (160, 160, 200)
ACCENT = (100, 180, 255)
DONE_COLOR = (80, 200, 120)
UNDONE_COLOR = (200, 100, 100)
PANEL_ALPHA = 185
BORDER_RADIUS = 18


def render_date_panel(canvas: Image.Image, x: int, y: int, w: int):
    now = datetime.now()
    day_str = now.strftime("%A")
    date_str = now.strftime("%d %B %Y")

    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    panel_h = 120
    draw_rounded_rect(draw, (x, y, x + w, y + panel_h), BORDER_RADIUS, PANEL_BG, PANEL_ALPHA)

    # Accent bar
    draw.rounded_rectangle([x, y, x + 4, y + panel_h], radius=2, fill=(*ACCENT, 255))

    font_day = get_font(38, bold=True)
    font_date = get_font(20)
    font_time = get_font(28, bold=True)

    draw.text((x + 22, y + 12), day_str, font=font_day, fill=(*TEXT_PRIMARY, 255))
    draw.text((x + 22, y + 56), date_str, font=font_date, fill=(*TEXT_SECONDARY, 220))

    return Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")


def render_task_panel(
    canvas: Image.Image,
    x: int, y: int, w: int,
    title: str,
    tasks: list[dict],
    max_tasks: int = 8,
) -> tuple[Image.Image, int]:
    if not tasks:
        return canvas, y

    font_title = get_font(22, bold=True)
    font_item = get_font(17)

    line_h = 30
    padding = 16
    header_h = 44
    tasks_shown = tasks[:max_tasks]
    panel_h = header_h + len(tasks_shown) * line_h + padding

    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw_rounded_rect(draw, (x, y, x + w, y + panel_h), BORDER_RADIUS, PANEL_BG, PANEL_ALPHA)
    draw.rounded_rectangle([x, y, x + 4, y + panel_h], radius=2, fill=(*ACCENT, 255))

    draw.text((x + 22, y + 10), title.upper(), font=font_title, fill=(*ACCENT, 255))

    sep_y = y + header_h - 6
    draw.line([(x + 16, sep_y), (x + w - 16, sep_y)], fill=(*ACCENT, 60), width=1)

    for i, task in enumerate(tasks_shown):
        ty = y + header_h + i * line_h
        done = task.get("done", False)
        col = (*DONE_COLOR, 200) if done else (*TEXT_PRIMARY, 220)
        bullet = "✓" if done else "•"
        bullet_col = (*DONE_COLOR, 255) if done else (*ACCENT, 200)
        draw.text((x + 22, ty), bullet, font=font_item, fill=bullet_col)
        label = task["text"]
        if done:
            # strikethrough effect
            bbox = draw.textbbox((x + 42, ty), label, font=font_item)
            mid_y = (bbox[1] + bbox[3]) // 2
            draw.line([(bbox[0], mid_y), (bbox[2], mid_y)], fill=col, width=1)
        draw.text((x + 42, ty), label, font=font_item, fill=col)

    result = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
    return result, y + panel_h + 16


def render_notes_panel(canvas: Image.Image, x: int, y: int, w: int, notes: str) -> Image.Image:
    if not notes.strip():
        return canvas

    font_title = get_font(18, bold=True)
    font_body = get_font(15)

    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    lines = wrap_text(notes, font_body, w - 40, draw)
    panel_h = 40 + len(lines) * 22 + 12

    draw_rounded_rect(draw, (x, y, x + w, y + panel_h), BORDER_RADIUS, PANEL_BG, PANEL_ALPHA)
    draw.rounded_rectangle([x, y, x + 4, y + panel_h], radius=2, fill=(255, 200, 80, 255))

    draw.text((x + 22, y + 8), "NOTES", font=font_title, fill=(255, 200, 80, 255))
    sep_y = y + 34
    draw.line([(x + 16, sep_y), (x + w - 16, sep_y)], fill=(255, 200, 80, 60), width=1)

    for i, line in enumerate(lines):
        draw.text((x + 22, y + 42 + i * 22), line, font=font_body, fill=(*TEXT_SECONDARY, 220))

    return Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")

def generate_wallpaper(tasks_data: dict | None = None) -> Path:
    if tasks_data is None:
        with open(TASKS_FILE, 'r') as f:
            data = json.load(f)
    else:
        data = tasks_data
    
    daily = data.get('daily', [])
    weekly = data.get('weekly', [])
    notes = data.get('notes', '')
    resolution_str = data.get('resolution', '1920x1080')
    w, h = parse_resolution(resolution_str)

    img = load_wallpaper_source(w, h)
    if img is None:
        print("No wallpaper source found, falling back to generated background")

    # Layout: right column panels
    margin = 40
    panel_w = min(400, w // 4)
    px = w - panel_w - margin
    py = margin

    img = render_date_panel(img, px, py, panel_w)
    py += 136

    img, py = render_task_panel(img, px, py, panel_w, "Daily Tasks", data.get("daily", []))
    img, py = render_task_panel(img, px, py, panel_w, "Weekly Tasks", data.get("weekly", []))
    img = render_notes_panel(img, px, py, panel_w, data.get("notes", ""))

    # Watermark
    wm_font = get_font(13)
    wm_overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    wd = ImageDraw.Draw(wm_overlay)
    ts = datetime.now().strftime("Generated %Y-%m-%d %H:%M")
    wd.text((margin, h - 30), ts, font=wm_font, fill=(*TEXT_SECONDARY, 100))
    img = Image.alpha_composite(img.convert("RGBA"), wm_overlay).convert("RGB")

    out_path = OUTPUT_DIR / "wallpaper.png"
    img.save(out_path, "PNG", optimize=True)
    return out_path
