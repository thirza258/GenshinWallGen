"""Exercise the real export router without wallpaper storage or DB side effects."""
import base64
import importlib.util
from io import BytesIO
from pathlib import Path
import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image, features

spec = importlib.util.spec_from_file_location("pixel_api", Path(__file__).resolve().parents[1] / "app/api/pixel.py")
pixel_api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pixel_api)
app = FastAPI()
app.include_router(pixel_api.router)
client = TestClient(app)


def png_frame(x=0, size=(4, 4), duration=125):
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    image.putpixel((x, 1), (0, 0, 0, 255))
    image.putpixel((x, 2), (255, 0, 77, 255))
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return {"png": base64.b64encode(buffer.getvalue()).decode(), "duration": duration}


class PixelExportTests(unittest.TestCase):
    def payload(self, format="apng", **kwargs):
        return {"format": format, "frames": [png_frame(), png_frame(2, duration=250)], **kwargs}

    def test_apng_preserves_transparency_frame_timing_and_does_not_smear(self):
        response = client.post("/api/pixel/export", json=self.payload(scale=2, loop=False))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/apng")
        image = Image.open(BytesIO(response.content))
        self.assertEqual(image.n_frames, 2)
        self.assertEqual(image.size, (8, 8))
        self.assertEqual(image.info["loop"], 1)
        self.assertEqual(image.info["duration"], 125)
        self.assertEqual(image.getpixel((0, 2)), (0, 0, 0, 255))
        image.seek(1)
        self.assertEqual(image.info["duration"], 250)
        self.assertEqual(image.getpixel((0, 2))[3], 0)
        self.assertEqual(image.getpixel((4, 2)), (0, 0, 0, 255))

    def test_gif_keeps_opaque_black_and_transparent_background(self):
        response = client.post("/api/pixel/export", json=self.payload("gif", loop=False))
        self.assertEqual(response.status_code, 200)
        image = Image.open(BytesIO(response.content))
        self.assertEqual(image.n_frames, 2)
        self.assertNotIn("loop", image.info)
        rgba = image.convert("RGBA")
        self.assertEqual(rgba.getpixel((0, 1)), (0, 0, 0, 255))
        self.assertEqual(rgba.getpixel((3, 3))[3], 0)
        image.seek(1)
        self.assertEqual(image.convert("RGBA").getpixel((0, 1))[3], 0)

    @unittest.skipUnless(features.check("webp_anim"), "Animated WebP is unavailable")
    def test_webp_is_lossless_and_scaled_with_nearest_neighbor(self):
        response = client.post("/api/pixel/export", json=self.payload("webp", scale=4))
        self.assertEqual(response.status_code, 200)
        image = Image.open(BytesIO(response.content))
        self.assertEqual(image.n_frames, 2)
        self.assertEqual(image.size, (16, 16))
        self.assertEqual(image.info["loop"], 0)
        self.assertEqual(image.convert("RGBA").getpixel((3, 11)), (255, 0, 77, 255))

    def test_single_frame_exports_work_in_all_formats(self):
        for format in ["gif", "apng", "webp"]:
            response = client.post("/api/pixel/export", json={"format": format, "frames": [png_frame()]})
            self.assertEqual(response.status_code, 200, response.text[:200] if response.status_code != 200 else "")
            self.assertEqual(Image.open(BytesIO(response.content)).size, (4, 4))

    def test_malformed_images_and_mismatched_dimensions_return_validation_errors(self):
        cases = [
            {"format": "png", "frames": [png_frame()]},
            {"format": "gif", "frames": []},
            {"format": "gif", "frames": [{"png": "not-base64!", "duration": 125}]},
            {"format": "gif", "frames": [png_frame(), png_frame(size=(8, 8))]},
            {"format": "gif", "frames": [png_frame(duration=0)]},
            {"format": "gif", "scale": 3, "frames": [png_frame()]},
        ]
        for payload in cases:
            response = client.post("/api/pixel/export", json=payload)
            self.assertEqual(response.status_code, 422)

    def test_dimensions_and_total_scaled_pixel_budget_are_bounded(self):
        oversized = client.post("/api/pixel/export", json={"format": "gif", "frames": [png_frame(size=(513, 4))]})
        self.assertEqual(oversized.status_code, 422)
        payload = {"format": "gif", "scale": 8, "frames": [png_frame(size=(512, 512))] * 2}
        self.assertEqual(client.post("/api/pixel/export", json=payload).status_code, 422)


if __name__ == "__main__":
    unittest.main()
