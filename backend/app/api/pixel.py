"""Bounded, anonymous animation encoding for the browser-based Pixel Studio."""

import base64
import binascii
from io import BytesIO
from typing import Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError, features
from pydantic import BaseModel, ConfigDict, Field, model_validator


router = APIRouter(prefix="/api/pixel", tags=["pixel-studio"])
MAX_SOURCE_PIXELS = 8_000_000
MAX_OUTPUT_PIXELS = 32_000_000
MAX_ENCODED_BYTES = 8_000_000


class AnimationFrame(BaseModel):
    model_config = ConfigDict(extra="forbid")
    png: str = Field(min_length=1, max_length=1_500_000)
    duration: int = Field(ge=1, le=10_000, strict=True)


class AnimationExport(BaseModel):
    model_config = ConfigDict(extra="forbid")
    format: Literal["gif", "apng", "webp"]
    scale: Literal[1, 2, 4, 8] = 1
    loop: bool = True
    frames: list[AnimationFrame] = Field(min_length=1, max_length=240)

    @model_validator(mode="after")
    def bound_payload(self):
        if sum(len(frame.png) for frame in self.frames) > MAX_ENCODED_BYTES:
            raise ValueError("Animation payload is too large.")
        return self


def decode_frames(payload: AnimationExport) -> list[Image.Image]:
    frames = []
    size = None
    try:
        for frame in payload.frames:
            data = base64.b64decode(frame.png, validate=True)
            with Image.open(BytesIO(data)) as source:
                if source.format != "PNG" or getattr(source, "n_frames", 1) != 1:
                    raise HTTPException(422, "Each frame must be a single PNG image.")
                width, height = source.size
                if not 1 <= width <= 512 or not 1 <= height <= 512:
                    raise HTTPException(422, "Source frames must be at most 512 × 512 pixels.")
                if size is None:
                    size = source.size
                    pixels = width * height * len(payload.frames)
                    if pixels > MAX_SOURCE_PIXELS or pixels * payload.scale**2 > MAX_OUTPUT_PIXELS:
                        raise HTTPException(422, "Animation is too large. Reduce the scale or number of frames.")
                elif source.size != size:
                    raise HTTPException(422, "All animation frames must have the same dimensions.")
                image = source.convert("RGBA")
                if payload.scale != 1:
                    image = image.resize((width * payload.scale, height * payload.scale), Image.Resampling.NEAREST)
                frames.append(image)
    except (binascii.Error, ValueError, OSError, UnidentifiedImageError, Image.DecompressionBombError) as error:
        raise HTTPException(422, "A frame contains invalid PNG data.") from error
    return frames


def gif_frame(image: Image.Image) -> Image.Image:
    # Reserve palette index 255 for transparency; opaque black remains visible.
    result = image.convert("RGB").quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    transparent = image.getchannel("A").point(lambda a: 255 if a < 128 else 0)
    result.paste(255, mask=transparent)
    palette = result.getpalette() or []
    result.putpalette((palette + [0] * 768)[:768])
    result.info["transparency"] = 255
    return result


@router.post("/export")
def export_animation(payload: AnimationExport):
    """Encode in a worker thread; no authentication, storage, or user data needed."""
    if payload.format == "webp" and not features.check("webp_anim"):
        raise HTTPException(503, "This server does not support animated WebP. Choose APNG or GIF.")
    frames = decode_frames(payload)
    durations = [frame.duration for frame in payload.frames]
    output = BytesIO()
    try:
        if payload.format == "gif":
            frames = [gif_frame(frame) for frame in frames]
            # Omitting the GIF loop extension means play once; loop=1 repeats.
            options = {"loop": 0} if payload.loop else {}
            frames[0].save(output, format="GIF", save_all=True, append_images=frames[1:],
                           duration=durations, disposal=2, transparency=255, optimize=False, **options)
            media_type = "image/gif"
        elif payload.format == "apng":
            frames[0].save(output, format="PNG", save_all=True, append_images=frames[1:],
                           duration=durations, loop=0 if payload.loop else 1, disposal=0, blend=0)
            media_type = "image/apng"
        else:
            frames[0].save(output, format="WEBP", save_all=True, append_images=frames[1:],
                           duration=durations, loop=0 if payload.loop else 1, lossless=True, exact=True, method=4)
            media_type = "image/webp"
    except (OSError, ValueError) as error:
        raise HTTPException(422, "The animation could not be encoded. Try a smaller export.") from error
    return Response(output.getvalue(), media_type=media_type,
                    headers={"Content-Disposition": f'attachment; filename="animation.{payload.format}"',
                             "Cache-Control": "no-store"})
