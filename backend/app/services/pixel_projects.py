"""Validate and encode private project snapshots before storing them."""

import base64
import binascii
import json
import math
import re
import zlib
from io import BytesIO

from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError

MAX_BODY_BYTES = 40_000_000
MAX_PIXELS = 8_388_608
MAX_PROJECTS = 100
MAX_ACCOUNT_BYTES = 200_000_000
# Version-one terrain names match frontend/src/pixel/model.js.
THEMES = (
    "Grassland",
    "Dungeon / Cave",
    "Cyberpunk",
    "Sci-Fi",
    "Castle stone",
    "Enchanted forest",
    "Cozy village",
    "Café interior",
    "School floor",
    "Sakura garden",
    "Festival paving",
    "Coastal path",
)


def validate_document(p):
    def check(condition):
        if not condition:
            raise HTTPException(
                422, "Invalid Pixel Studio project or project limits exceeded."
            )

    def integer(value, low, high):
        return type(value) is int and low <= value <= high

    def number(value, low, high):
        return (
            type(value) in (int, float)
            and math.isfinite(value)
            and low <= value <= high
        )

    def text(value, limit=100, allow_empty=False):
        if not isinstance(value, str) or (not value and not allow_empty):
            return False
        try:
            return len(value.encode("utf-16-le")) // 2 <= limit
        except UnicodeError:
            return False

    def identifier(value):
        return (
            isinstance(value, str)
            and re.fullmatch(r"[\w-]{1,100}", value, flags=re.ASCII)
            and value not in ("__proto__", "prototype", "constructor")
        )

    check(isinstance(p, dict))
    check(
        integer(p.get("version"), 1, 1)
        and p.get("mode") in ("sprite", "puppet", "background")
    )
    check(
        text(p.get("name"))
        and integer(p.get("width"), 1, 512)
        and integer(p.get("height"), 1, 512)
    )
    palette, layers, frames, rig = (
        p.get(key) for key in ("palette", "layers", "frames", "rig")
    )
    check(isinstance(palette, list) and 1 <= len(palette) <= 256)
    check(
        all(isinstance(c, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", c) for c in palette)
    )
    check(
        isinstance(layers, list)
        and 1 <= len(layers) <= 16
        and isinstance(frames, list)
        and 1 <= len(frames) <= 64
    )
    size = p["width"] * p["height"]
    check(size * len(layers) * len(frames) <= MAX_PIXELS)
    check(
        isinstance(rig, list)
        and len(rig) <= 32
        and (p["mode"] != "puppet" or len(rig) > 0)
    )
    check(text(p.get("paletteName")) and p.get("theme") in THEMES)
    check(
        all(
            type(p.get(key)) is bool
            for key in ("paletteLocked", "wrapX", "wrapY", "pixelSnap")
        )
    )
    check(
        p.get("fps") in (8, 12, 24) and p.get("interpolation") in ("stepped", "smooth")
    )
    check(
        p.get("tileSize") in (8, 16, 32) and p.get("tileRule") in ("16", "47", "wang")
    )

    def pixels(values, count):
        return (
            isinstance(values, list)
            and len(values) == count
            and all(integer(v, -1, len(palette) - 1) for v in values)
        )

    layer_ids = set()
    for layer in layers:
        check(isinstance(layer, dict) and identifier(layer.get("id")))
        check(layer["id"] not in layer_ids)
        layer_ids.add(layer["id"])
        check(
            text(layer.get("name"))
            and number(layer.get("opacity"), 0, 1)
            and number(layer.get("ratio"), 0, 2)
        )
        check(
            layer.get("blend")
            in ("source-over", "multiply", "screen", "overlay", "lighter")
        )
        check(
            all(type(layer.get(key)) is bool for key in ("visible", "locked", "clip"))
        )
    bones = {}
    for part in rig:
        check(
            isinstance(part, dict)
            and identifier(part.get("id"))
            and part["id"] not in bones
        )
        check(
            text(part.get("name"))
            and integer(part.get("width"), 1, 256)
            and integer(part.get("height"), 1, 256)
        )
        check(pixels(part.get("pixels"), part["width"] * part["height"]))
        check(number(part.get("x"), -1024, 1024) and number(part.get("y"), -1024, 1024))
        check(
            number(part.get("pivotX"), 0, part["width"])
            and number(part.get("pivotY"), 0, part["height"])
        )
        check(part.get("parent") is None or identifier(part.get("parent")))
        bones[part["id"]] = part
    for part in rig:
        current, seen = part, set()
        while current is not None:
            check(current["id"] not in seen)
            seen.add(current["id"])
            parent = current.get("parent")
            check(parent is None or parent in bones)
            current = bones.get(parent)
    frame_ids = set()
    for frame in frames:
        check(
            isinstance(frame, dict)
            and identifier(frame.get("id"))
            and frame["id"] not in frame_ids
        )
        frame_ids.add(frame["id"])
        check(
            integer(frame.get("duration"), 20, 10000)
            and text(frame.get("tag"), 40, allow_empty=True)
        )
        check(
            isinstance(frame.get("pose"), dict)
            and all(
                key in bones and number(value, -360, 360)
                for key, value in frame["pose"].items()
            )
        )
        check(isinstance(frame.get("cels"), dict) and set(frame["cels"]) == layer_ids)
        for cel in frame["cels"].values():
            check(
                isinstance(cel, dict)
                and pixels(cel.get("pixels"), size)
                and isinstance(cel.get("tiles"), dict)
            )
            for key, value in cel["tiles"].items():
                check(
                    isinstance(key, str)
                    and re.fullmatch(r"\d{1,3},\d{1,3}", key)
                    and type(value) is int
                    and value == 1
                )
                x, y = map(int, key.split(","))
                check(
                    x < math.ceil(p["width"] / p["tileSize"])
                    and y < math.ceil(p["height"] / p["tileSize"])
                )
    return p


def encode_snapshot(payload, project_id):
    if not isinstance(payload, dict) or set(payload) != {
        "project",
        "preview_png",
        "frame",
        "revision",
    }:
        raise HTTPException(422, "Provide a project, PNG preview, frame and revision.")
    p = validate_document(payload["project"])
    if (
        p.get("id") != str(project_id)
        or type(payload["revision"]) is not int
        or payload["revision"] < 0
    ):
        raise HTTPException(422, "Invalid project ID or revision.")
    if type(payload["frame"]) is not int or not 0 <= payload["frame"] < len(
        p["frames"]
    ):
        raise HTTPException(422, "Invalid preview frame.")
    encoded = payload["preview_png"]
    if not isinstance(encoded, str) or not 1 <= len(encoded) <= 2_000_000:
        raise HTTPException(422, "PNG preview is too large.")
    try:
        with Image.open(BytesIO(base64.b64decode(encoded, validate=True))) as source:
            if (
                source.format != "PNG"
                or source.size != (p["width"], p["height"])
                or getattr(source, "n_frames", 1) != 1
            ):
                raise HTTPException(
                    422, "Preview must be a single PNG matching the project dimensions."
                )
            image = source.convert("RGBA")
            preview = BytesIO()
            image.save(preview, format="PNG")
            image.thumbnail((128, 128), Image.Resampling.NEAREST)
            thumbnail = BytesIO()
            image.save(thumbnail, format="PNG")
    except (
        binascii.Error,
        ValueError,
        OSError,
        UnidentifiedImageError,
        Image.DecompressionBombError,
    ) as error:
        raise HTTPException(422, "Invalid PNG preview.") from error
    document = zlib.compress(
        json.dumps(p, separators=(",", ":"), allow_nan=False).encode()
    )
    return {
        "name": p["name"],
        "mode": p["mode"],
        "width": p["width"],
        "height": p["height"],
        "frame_count": len(p["frames"]),
        "preview_frame": payload["frame"],
        "document": document,
        "preview": preview.getvalue(),
        "thumbnail": thumbnail.getvalue(),
        "storage_bytes": len(document) + preview.tell() + thumbnail.tell(),
    }
