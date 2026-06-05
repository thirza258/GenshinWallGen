"""
wallpaper_gen.py — Core image generation logic using Pillow
"""
import json
import random
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps


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

def parse_resolution(res: str) -> tuple[int, int]:
    try:
        w, h = res.lower().split("x")
        return int(w), int(h)
    except Exception:
        return 1920, 1080


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

def load_wallpaper_source(w: int, h: int, image_id: str = None) -> Image.Image:
    candidates = list(WALLPAPER_SOURCE.glob("*.jpg")) + list(WALLPAPER_SOURCE.glob("*.png"))
    if not candidates:
        return None

    if image_id and image_id != "random":
        # Find the specific image by filename
        target = WALLPAPER_SOURCE / image_id
        if target.exists() and target.suffix.lower() in (".jpg", ".png"):
            path = target
        else:
            # Fallback to random if specified image not found
            path = random.choice(candidates)
    else:
        path = random.choice(candidates)

    try:
        img = Image.open(path).convert("RGB")
        img = ImageOps.fit(img, (w, h), method=Image.LANCZOS)
        return img
    except Exception:
        return None


def list_source_images() -> list[str]:
    """Return sorted list of available source image filenames."""
    candidates = sorted(
        list(WALLPAPER_SOURCE.glob("*.jpg")) + list(WALLPAPER_SOURCE.glob("*.png")),
        key=lambda p: p.name,
    )
    return [p.name for p in candidates]



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

TEXT_PRIMARY = (255, 255, 255)
TEXT_SECONDARY = (190, 195, 215)
ACCENT = (120, 190, 255)
DONE_COLOR = (80, 200, 120)


def create_glass_panel(
    canvas: Image.Image,
    xy: tuple[int, int, int, int],
    radius: int = 22,
    blur_radius: int = 12,
    tint: tuple[int, int, int, int] = (8, 10, 18, 190),
) -> Image.Image:
    """Create a glass-morphism panel as an RGBA image with alpha mask."""
    x0, y0, x1, y1 = xy

    region = canvas.crop((x0, y0, x1, y1))
    blurred = region.filter(ImageFilter.GaussianBlur(blur_radius))
    blurred = blurred.convert("RGBA")
    
    darkener = Image.new("RGBA", blurred.size, tint)
    blurred.alpha_composite(darkener)

    mask = Image.new("L", blurred.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, blurred.size[0], blurred.size[1]],
        radius=radius,
        fill=255,
    )

    panel = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    panel.paste(blurred, (x0, y0), mask)
    return panel


def render_date_panel(canvas: Image.Image, x: int, y: int, w: int) -> int:
    """Render date panel onto canvas (in-place). Returns next y position."""
    now = datetime.now()
    day_str = now.strftime("%A")
    date_str = now.strftime("%d %B %Y")
    panel_h = 120

    # Composite glass panel onto canvas
    glass = create_glass_panel(canvas, (x, y, x + w, y + panel_h))
    canvas.paste(glass, (0, 0), glass)

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle([x, y, x + 4, y + panel_h], radius=2, fill=(*ACCENT, 255))

    font_day = get_font(38, bold=True)
    font_date = get_font(20)
    draw.text((x + 22, y + 12), day_str, font=font_day, fill=(*TEXT_PRIMARY, 255))
    draw.text((x + 22, y + 56), date_str, font=font_date, fill=(*TEXT_SECONDARY, 220))

    return y + panel_h + 16


def render_task_panel(
    canvas: Image.Image,
    x: int, y: int, w: int,
    title: str,
    tasks: list[dict],
    max_tasks: int = 8,
) -> int:
    """Render task panel onto canvas (in-place). Returns next y position."""
    if not tasks:
        return y

    font_title = get_font(22, bold=True)
    font_item = get_font(17)

    line_h = 30
    padding = 16
    header_h = 44
    tasks_shown = tasks[:max_tasks]
    panel_h = header_h + len(tasks_shown) * line_h + padding

    # Composite glass panel onto canvas
    glass = create_glass_panel(canvas, (x, y, x + w, y + panel_h))
    canvas.paste(glass, (0, 0), glass)

    draw = ImageDraw.Draw(canvas)
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
            bbox = draw.textbbox((x + 42, ty), label, font=font_item)
            mid_y = (bbox[1] + bbox[3]) // 2
            draw.line([(bbox[0], mid_y), (bbox[2], mid_y)], fill=col, width=1)
        draw.text((x + 42, ty), label, font=font_item, fill=col)

    return y + panel_h + 16


def render_notes_panel(canvas: Image.Image, x: int, y: int, w: int, notes: str) -> int:
    """Render notes panel onto canvas (in-place). Returns next y position."""
    if not notes.strip():
        return y

    font_title = get_font(18, bold=True)
    font_body = get_font(15)
    draw = ImageDraw.Draw(canvas)

    lines = wrap_text(notes, font_body, w - 40, draw)
    panel_h = 40 + len(lines) * 22 + 12

    # Composite glass panel onto canvas
    glass = create_glass_panel(canvas, (x, y, x + w, y + panel_h))
    canvas.paste(glass, (0, 0), glass)

    draw.rounded_rectangle([x, y, x + 4, y + panel_h], radius=2, fill=(255, 200, 80, 255))
    draw.text((x + 22, y + 8), "NOTES", font=font_title, fill=(255, 200, 80, 255))
    
    sep_y = y + 34
    draw.line([(x + 16, sep_y), (x + w - 16, sep_y)], fill=(255, 200, 80, 60), width=1)

    for i, line in enumerate(lines):
        draw.text((x + 22, y + 42 + i * 22), line, font=font_body, fill=(*TEXT_SECONDARY, 220))

    return y + panel_h + 16


def generate_wallpaper(tasks_data: dict | None = None) -> Path:
    if tasks_data is None:
        with open(TASKS_FILE, 'r') as f:
            data = json.load(f)
    else:
        data = tasks_data

    resolution_str = data.get('resolution', '1920x1080')
    image_id = data.get('image_id', '')
    w, h = parse_resolution(resolution_str)

    # Load base image and convert to RGBA ONCE
    img = load_wallpaper_source(w, h, image_id=image_id)
    if img is None:
        print("No wallpaper source found, falling back to generated background")
        img = Image.new("RGB", (w, h), color=(20, 25, 40))
    
    canvas = img.convert("RGBA")  # ← Single conversion at start

    # Layout: right column panels
    margin = 40
    panel_w = min(400, w // 4)
    px = w - panel_w - margin
    py = margin

    # Render all panels in-place on the same canvas
    py = render_date_panel(canvas, px, py, panel_w)
    py = render_task_panel(canvas, px, py, panel_w, "Daily Tasks", data.get("daily", []))
    py = render_task_panel(canvas, px, py, panel_w, "Weekly Tasks", data.get("weekly", []))
    py = render_notes_panel(canvas, px, py, panel_w, data.get("notes", ""))

    # Watermark - draw directly on canvas
    wm_font = get_font(13)
    wd = ImageDraw.Draw(canvas)
    ts = datetime.now().strftime("Generated %Y-%m-%d %H:%M")
    wd.text((margin, h - 30), ts, font=wm_font, fill=(*TEXT_SECONDARY, 100))

    # Convert to RGB ONCE at the end
    result = canvas.convert("RGB")
    
    out_path = OUTPUT_DIR / "wallpaper.png"
    result.save(out_path, "PNG", optimize=True)
    return out_path