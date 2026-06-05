import json
import random
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

# ──────────────────────────────────────────────────────────────────────────────
# Paths & Setup
# ──────────────────────────────────────────────────────────────────────────────
def get_project_root() -> Path:
    current = Path(__file__).resolve()
    return current.parent.parent

PROJECT_ROOT = get_project_root()
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "static"
TASKS_FILE = DATA_DIR / "tasks.json"
WALLPAPER_SOURCE = PROJECT_ROOT / "source"
LOCAL_FONT = PROJECT_ROOT / "backend" / "font" / "zh-cn.ttf"
CONTAINER_FONT = Path("/usr/local/share/fonts/custom/zh-cn.ttf")

OUTPUT_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# Cached font (single size)
_FONT_CACHE = {}
_FONT_PATH_CACHE = {}
_BG_CACHE = {}

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────
def parse_resolution(res: str) -> tuple[int, int]:
    try:
        w, h = res.lower().split("x")
        return int(w), int(h)
    except Exception:
        return 1920, 1080

def wrap_text(text: str, font, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    """Wrap text to fit max_width using the given draw context (for textlength)."""
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

# ──────────────────────────────────────────────────────────────────────────────
# Background Loading
# ──────────────────────────────────────────────────────────────────────────────
def load_wallpaper_source(w: int, h: int, image_id: str = None) -> Image.Image:
    # 1. Handle specific image request
    if image_id and image_id != "random":
        cache_key = (w, h, image_id)
        if cache_key in _BG_CACHE:
            return _BG_CACHE[cache_key].copy()
            
    # 2. Handle random image request from the cache
    # Filter the cache for images that match the requested resolution
    valid_cached_keys = [key for key in _BG_CACHE.keys() if key[0] == w and key[1] == h]
    
    if valid_cached_keys:
        random_key = random.choice(valid_cached_keys)
        return _BG_CACHE[random_key].copy()

    # 3. Fallback: If cache misses (e.g., requested an odd resolution like 800x600), 
    # load and resize from disk on the fly
    candidates = list(WALLPAPER_SOURCE.glob("*.jpg")) + list(WALLPAPER_SOURCE.glob("*.png"))
    if not candidates:
        return None

    path = random.choice(candidates)
    if image_id and image_id != "random":
        target = WALLPAPER_SOURCE / image_id
        if target.exists():
            path = target

    try:
        img = Image.open(path).convert("RGB")
        img.thumbnail((w * 2, h * 2))
        img = ImageOps.fit(img, (w, h), method=Image.BILINEAR)
        
        # Optional: Save this new resolution to the cache for next time
        _BG_CACHE[(w, h, path.name)] = img
        return img.copy()
    except Exception:
        return None

def preload_backgrounds(target_w: int = 1920, target_h: int = 1080):
    """Preload, resize, and cache all available wallpapers."""
    print("Preloading background images... This might take a moment.")
    candidates = list(WALLPAPER_SOURCE.glob("*.jpg")) + list(WALLPAPER_SOURCE.glob("*.png"))
    
    for path in candidates:
        try:
            # The cache key includes resolution and filename so you can support multiple sizes later if needed
            cache_key = (target_w, target_h, path.name)
            
            img = Image.open(path).convert("RGB")
            
            # Fast downscale first to save processing time
            img.thumbnail((target_w * 2, target_h * 2)) 
            # Exact crop/fit
            img = ImageOps.fit(img, (target_w, target_h), method=Image.BILINEAR)
            
            _BG_CACHE[cache_key] = img
        except Exception as e:
            print(f"Failed to preload {path.name}: {e}")
            
    print(f"Successfully preloaded {len(_BG_CACHE)} background images.")

def list_source_images() -> list[str]:
    candidates = sorted(
        list(WALLPAPER_SOURCE.glob("*.jpg")) + list(WALLPAPER_SOURCE.glob("*.png")),
        key=lambda p: p.name,
    )
    return [p.name for p in candidates]

# ──────────────────────────────────────────────────────────────────────────────
# Single Font Loader (one size for all text)
# ──────────────────────────────────────────────────────────────────────────────
def get_main_font(size: int = 18) -> ImageFont.FreeTypeFont:
    """Load one font (cached) – all text uses this size."""
    if size in _FONT_CACHE:
        return _FONT_CACHE[size]

    # Try custom Chinese font first
    custom_paths = []
    if LOCAL_FONT.exists():
        custom_paths.append(LOCAL_FONT)
    if CONTAINER_FONT.exists():
        custom_paths.append(CONTAINER_FONT)

    fallbacks = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:/Windows/Fonts/arial.ttf",
    ]
    candidates = custom_paths + fallbacks

    for path in candidates:
        try:
            font = ImageFont.truetype(str(path), size)
            _FONT_CACHE[size] = font
            return font
        except Exception:
            continue

    default = ImageFont.load_default()
    _FONT_CACHE[size] = default
    return default

# ──────────────────────────────────────────────────────────────────────────────
# One‑Pass Drawing (all panels + text)
# ──────────────────────────────────────────────────────────────────────────────
def generate_wallpaper(tasks_data: dict | None = None) -> Path:
    # Load data
    if tasks_data is None:
        with open(TASKS_FILE, 'r') as f:
            data = json.load(f)
    else:
        data = tasks_data

    resolution_str = data.get('resolution', '1920x1080')
    image_id = data.get('image_id', '')
    w, h = parse_resolution(resolution_str)

    # Background image (RGB)
    bg = load_wallpaper_source(w, h, image_id=image_id)
    if bg is None:
        bg = Image.new("RGB", (w, h), color=(253, 231, 206))

    # Convert to RGBA for overlays
    canvas = bg.convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    # Single font for everything (size 18 works well for 1080p)
    font = get_main_font(18)

    # Layout constants
    margin = 40
    panel_w = min(400, w // 4)
    px = w - panel_w - margin
    py = margin

    # Colors (RGBA)
    PANEL_BG = (255, 252, 243, 200)      # warm white, semi‑transparent
    ACCENT = (21, 29, 77, 255)           # deep blue
    TEXT_PRIMARY = (0, 0, 0, 220)
    TEXT_SECONDARY = (21, 29, 77, 200)
    DONE_COLOR = (0, 0, 0, 160)
    SEPARATOR = (21, 29, 77, 60)

    # Helper to draw a rounded rectangle panel background
    def draw_panel(x, y, w, h, radius=22):
        draw.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=PANEL_BG)

    # ─── Date Panel ──────────────────────────────────────────────────────────
    now = datetime.now()
    day_str = now.strftime("%A")
    date_str = now.strftime("%d %B %Y")
    date_panel_h = 100

    draw_panel(px, py, panel_w, date_panel_h)
    # Left accent line
    draw.rounded_rectangle([px, py, px + 4, py + date_panel_h], radius=2, fill=ACCENT)

    # Draw date text (same font, different positions)
    draw.text((px + 22, py + 12), day_str, font=font, fill=TEXT_PRIMARY)
    draw.text((px + 22, py + 52), date_str, font=font, fill=TEXT_SECONDARY)

    py += date_panel_h + 16

    # ─── Daily Tasks Panel ───────────────────────────────────────────────────
    daily = data.get("daily", [])
    if daily:
        title = "DAILY TASKS"
        header_h = 40
        line_h = 28
        tasks_shown = daily[:8]
        panel_h = header_h + len(tasks_shown) * line_h + 16

        draw_panel(px, py, panel_w, panel_h)
        draw.rounded_rectangle([px, py, px + 4, py + panel_h], radius=2, fill=ACCENT)
        draw.text((px + 22, py + 10), title, font=font, fill=ACCENT)

        sep_y = py + header_h - 6
        draw.line([(px + 16, sep_y), (px + panel_w - 16, sep_y)], fill=SEPARATOR, width=1)

        for i, task in enumerate(tasks_shown):
            ty = py + header_h + i * line_h
            done = task.get("done", False)
            color = DONE_COLOR if done else TEXT_PRIMARY
            bullet = "✓" if done else "•"
            bullet_color = ACCENT if not done else DONE_COLOR

            draw.text((px + 22, ty), bullet, font=font, fill=bullet_color)
            label = task["text"]
            if done:
                bbox = draw.textbbox((px + 42, ty), label, font=font)
                mid_y = (bbox[1] + bbox[3]) // 2
                draw.line([(bbox[0], mid_y), (bbox[2], mid_y)], fill=color, width=1)
            draw.text((px + 42, ty), label, font=font, fill=color)

        py += panel_h + 16

    # ─── Weekly Tasks Panel ──────────────────────────────────────────────────
    weekly = data.get("weekly", [])
    if weekly:
        title = "WEEKLY TASKS"
        header_h = 40
        line_h = 28
        tasks_shown = weekly[:8]
        panel_h = header_h + len(tasks_shown) * line_h + 16

        draw_panel(px, py, panel_w, panel_h)
        draw.rounded_rectangle([px, py, px + 4, py + panel_h], radius=2, fill=ACCENT)
        draw.text((px + 22, py + 10), title, font=font, fill=ACCENT)

        sep_y = py + header_h - 6
        draw.line([(px + 16, sep_y), (px + panel_w - 16, sep_y)], fill=SEPARATOR, width=1)

        for i, task in enumerate(tasks_shown):
            ty = py + header_h + i * line_h
            done = task.get("done", False)
            color = DONE_COLOR if done else TEXT_PRIMARY
            bullet = "✓" if done else "•"
            bullet_color = ACCENT if not done else DONE_COLOR

            draw.text((px + 22, ty), bullet, font=font, fill=bullet_color)
            label = task["text"]
            if done:
                bbox = draw.textbbox((px + 42, ty), label, font=font)
                mid_y = (bbox[1] + bbox[3]) // 2
                draw.line([(bbox[0], mid_y), (bbox[2], mid_y)], fill=color, width=1)
            draw.text((px + 42, ty), label, font=font, fill=color)

        py += panel_h + 16

    # ─── Notes Panel ─────────────────────────────────────────────────────────
    notes = data.get("notes", "")
    if notes.strip():
        title = "NOTES"
        header_h = 40
        # Wrap notes text
        lines = wrap_text(notes, font, panel_w - 40, draw)
        line_h = 24
        panel_h = header_h + len(lines) * line_h + 20

        draw_panel(px, py, panel_w, panel_h)
        draw.rounded_rectangle([px, py, px + 4, py + panel_h], radius=2, fill=(255, 200, 80, 255))
        draw.text((px + 22, py + 10), title, font=font, fill=(255, 200, 80, 255))

        sep_y = py + header_h - 6
        draw.line([(px + 16, sep_y), (px + panel_w - 16, sep_y)], fill=(255, 200, 80, 80), width=1)

        for i, line in enumerate(lines):
            draw.text((px + 22, py + header_h + i * line_h), line, font=font, fill=TEXT_SECONDARY)

        py += panel_h + 16

    # ─── Watermark ───────────────────────────────────────────────────────────
    ts = datetime.now().strftime("Generated %Y-%m-%d %H:%M")
    draw.text((margin, h - 30), ts, font=font, fill=(*TEXT_SECONDARY[:3], 100))

    # Convert back to RGB and save
    result = canvas.convert("RGB")
    out_path = OUTPUT_DIR / "wallpaper.jpg"
    result.save(out_path, "JPEG", quality=90)
    return out_path