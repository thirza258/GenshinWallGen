import test from "node:test";
import assert from "node:assert/strict";
import { fitCanvasZoom } from "../src/pixel/viewport.js";

test("sprites, scenes and large tiled previews fit narrow phone viewports", () => {
  for (const [width, height] of [
    [32, 32],
    [128, 72],
    [320, 180],
    [512, 512],
    [1536, 1536],
  ]) {
    for (const availableWidth of [272, 342, 720]) {
      const zoom = fitCanvasZoom(width, height, availableWidth, 240);
      assert.ok(width * zoom <= availableWidth);
      assert.ok(height * zoom <= 240);
      assert.ok(
        zoom >= 1 ? Number.isInteger(zoom) : Number.isInteger(Math.log2(zoom)),
      );
    }
  }
});
