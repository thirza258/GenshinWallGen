import test from "node:test";
import assert from "node:assert/strict";
import {
  blankPixels,
  boneTransforms,
  clone,
  createProject,
  floodFill,
  frameAt,
  interpolatedPose,
  linePoints,
  paint,
  PALETTES,
  paletteText,
  parsePalette,
  swapPalette,
  tileMask,
  tileVariants,
  validateProject,
} from "../src/pixel/model.js";

test("each creation pipeline produces a valid, independently editable project", () => {
  for (const mode of ["sprite", "puppet", "background"]) {
    const project = createProject({
      mode,
      sample: true,
      width: 64,
      height: 64,
    });
    const copy = validateProject(project);
    assert.deepEqual(copy, project);
    copy.frames[0].cels[copy.layers[0].id].pixels[0] = 1;
    assert.notEqual(
      copy.frames[0].cels[copy.layers[0].id].pixels,
      project.frames[0].cels[project.layers[0].id].pixels,
    );
  }
});

test("character bases scale to the 16 px canvas without invalid pivots or indices", () => {
  const p = createProject({ mode: "puppet", width: 16, height: 16 });
  assert.doesNotThrow(() => validateProject(p));
  assert.equal(p.rig.find((part) => part.id === "head").width, 6);
  for (const t of Object.values(boneTransforms(p, {}))) {
    assert.ok(t.x >= 0 && t.x <= 16 && t.y >= 0 && t.y <= 16);
  }
});

test("brush strokes cross both canvas boundaries and mirror on both axes", () => {
  const pixels = blankPixels(8, 8);
  paint(pixels, 8, 8, [[7, 7]], {
    color: 3,
    size: 3,
    wrapX: true,
    wrapY: true,
    mirrorX: true,
    mirrorY: true,
  });
  for (const [x, y] of [
    [0, 0],
    [7, 0],
    [0, 7],
    [7, 7],
    [6, 6],
    [1, 1],
  ])
    assert.equal(pixels[y * 8 + x], 3);
  assert.equal(pixels[3 * 8 + 3], -1);
});

test("continuous lines have no gaps and include both endpoints", () => {
  const points = linePoints([7, 1], [0, 6]);
  assert.deepEqual(points[0], [7, 1]);
  assert.deepEqual(points.at(-1), [0, 6]);
  for (let i = 1; i < points.length; i++)
    assert.ok(
      Math.abs(points[i][0] - points[i - 1][0]) <= 1 &&
        Math.abs(points[i][1] - points[i - 1][1]) <= 1,
    );
});

test("flood fill respects boundaries and joins opposite edges only in wrap mode", () => {
  const source = [0, 1, 1, 0, 0, 1, 1, 0];
  const pixels = [...source];
  floodFill(pixels, 4, 2, 0, 0, { color: 2 });
  assert.deepEqual(pixels, [2, 1, 1, 0, 2, 1, 1, 0]);
  floodFill(source, 4, 2, 0, 0, { color: 2, wrapX: true });
  assert.deepEqual(source, [2, 1, 1, 2, 2, 1, 1, 2]);
});

test("dithered fill terminates and preserves both palette colors", () => {
  const pixels = blankPixels(4, 4);
  floodFill(pixels, 4, 4, 0, 0, {
    color: 2,
    secondary: 5,
    dither: true,
    wrapX: true,
    wrapY: true,
  });
  assert.equal(pixels.filter((p) => p === 2).length, 8);
  assert.equal(pixels.filter((p) => p === 5).length, 8);
});

test("autotile rules contain exactly 16 edge variants or 47 normalized blob variants", () => {
  assert.equal(tileVariants("16").length, 16);
  assert.equal(tileVariants("wang").length, 16);
  assert.equal(tileVariants("47").length, 47);
  assert.equal(
    tileMask({ "2,0": 1 }, 1, 1, "47", 4, 4),
    0,
    "a detached diagonal is not connected",
  );
  assert.equal(
    tileMask({ "1,0": 1, "2,1": 1, "2,0": 1 }, 1, 1, "47", 4, 4),
    19,
  );
  assert.equal(
    tileMask({ "3,0": 1 }, 0, 0, "16", 4, 4, true),
    8,
    "a wrapped neighbor connects at the opposite edge",
  );
});

test("palette round trips support HEX, GIMP GPL, and JASC PAL", () => {
  for (const format of ["hex", "gpl", "pal"])
    assert.deepEqual(
      parsePalette(paletteText(PALETTES["PICO-8"], format)),
      PALETTES["PICO-8"],
    );
  assert.throws(() => parsePalette("JASC-PAL\n0100\n1\n256 0 0"));
  assert.throws(() => parsePalette("not a palette"));
});

test("palette swaps update every frame and shared part without losing transparency", () => {
  const p = createProject({ mode: "puppet" });
  p.frames.push(clone(p.frames[0]));
  for (const f of p.frames) f.cels[p.layers[0].id].pixels[0] = 15;
  swapPalette(p, PALETTES.GameBoy, "GameBoy");
  for (const f of p.frames) {
    assert.equal(f.cels[p.layers[0].id].pixels[0], 3);
    assert.equal(f.cels[p.layers[0].id].pixels[1], -1);
  }
  assert.ok(p.rig.every((part) => part.pixels.every((n) => n >= -1 && n < 4)));
});

test("playback uses individual frame durations and loops correctly", () => {
  const p = createProject({ sample: true });
  p.frames.forEach((f, i) => {
    f.duration = (i + 1) * 100;
  });
  assert.equal(frameAt(p, 99).index, 0);
  assert.equal(frameAt(p, 100).index, 1);
  assert.equal(frameAt(p, 299).index, 1);
  assert.equal(frameAt(p, 300).index, 2);
  assert.equal(frameAt(p, 600).index, 0);
});

test("stepped motion samples at discrete times and smooth mode moves between them", () => {
  const p = createProject({ mode: "puppet" });
  p.frames[0].duration = 1000;
  assert.equal(frameAt(p, 80).progress, 0);
  assert.equal(frameAt(p, 126).progress, 0.125);
  p.interpolation = "smooth";
  assert.equal(frameAt(p, 80).progress, 0.08);
});

test("FK rotates a complete child chain and takes the shortest angular path", () => {
  const p = createProject({ mode: "puppet" });
  p.pixelSnap = false;
  const idle = boneTransforms(p, {}),
    turned = boneTransforms(p, { "left-arm": 90 });
  assert.notDeepEqual(turned["left-hand"], idle["left-hand"]);
  assert.deepEqual(turned["right-hand"], idle["right-hand"]);
  p.frames[0].pose.torso = 170;
  p.frames.push(clone(p.frames[0]));
  p.frames[1].pose.torso = -170;
  assert.equal(interpolatedPose(p, 0, 0.5).torso, 180);
});

test("import validation rejects cyclic bones, dangerous identifiers, broken cels and indices", () => {
  const rig = createProject({ mode: "puppet" });
  rig.rig[0].parent = "left-hand";
  assert.throws(() => validateProject(rig));
  const unsafe = createProject({ mode: "puppet" });
  unsafe.rig[0].id = "__proto__";
  assert.throws(() => validateProject(unsafe));
  const missing = createProject();
  delete missing.frames[0].cels[missing.layers[0].id];
  assert.throws(() => validateProject(missing));
  const invalid = createProject();
  invalid.frames[0].cels[invalid.layers[0].id].pixels[0] = 256;
  assert.throws(() => validateProject(invalid));
  const duration = createProject();
  duration.frames[0].duration = 0;
  assert.throws(() => validateProject(duration));
});

test("import validation bounds allocations before inspecting oversized pixel arrays", () => {
  const p = createProject();
  p.width = 100000;
  assert.throws(() => validateProject(p));
  const many = createProject();
  many.frames = Array(65).fill(many.frames[0]);
  assert.throws(() => validateProject(many));
});
