export const VERSION = 1;
export const MAX_PIXELS = 8_388_608;
export const TOOLS = [
  ["pencil", "✎", "Pencil", "B"],
  ["eraser", "▱", "Eraser", "E"],
  ["fill", "◩", "Fill", "F"],
  ["picker", "⌖", "Pick color", "I"],
  ["line", "╱", "Line", "L"],
  ["rectangle", "□", "Rectangle", "R"],
  ["dither", "░", "Dither", "D"],
  ["pattern", "▦", "Pattern", "T"],
];
export const PALETTES = {
  "PICO-8": [
    "#000000",
    "#1d2b53",
    "#7e2553",
    "#008751",
    "#ab5236",
    "#5f574f",
    "#c2c3c7",
    "#fff1e8",
    "#ff004d",
    "#ffa300",
    "#ffec27",
    "#00e436",
    "#29adff",
    "#83769c",
    "#ff77a8",
    "#ffccaa",
  ],
  GameBoy: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  "NES 54": [
    "#666666",
    "#002a88",
    "#1412a7",
    "#3b00a4",
    "#5c007e",
    "#6e0040",
    "#6c0600",
    "#561d00",
    "#333500",
    "#0b4800",
    "#005200",
    "#004f08",
    "#00404d",
    "#000000",
    "#adadad",
    "#155fd9",
    "#4240ff",
    "#7527fe",
    "#a01acc",
    "#b71e7b",
    "#b53120",
    "#994e00",
    "#6b6d00",
    "#388700",
    "#0c9300",
    "#008f32",
    "#007c8d",
    "#fffeff",
    "#64b0ff",
    "#9290ff",
    "#c676ff",
    "#f36aff",
    "#fe6ecc",
    "#fe8170",
    "#ea9e22",
    "#bcbe00",
    "#88d800",
    "#5ce430",
    "#45e082",
    "#48cdde",
    "#c0dfff",
    "#d3d2ff",
    "#e8c8ff",
    "#fbc2ff",
    "#fec4ea",
    "#feccc5",
    "#f7d8a5",
    "#e4e594",
    "#cfef96",
    "#bdf4ab",
    "#b3f3cc",
    "#b5ebf2",
    "#b8b8b8",
    "#555555",
  ],
};
export const THEMES = {
  Grassland: ["#008751", "#00e436", "#ab5236", "#ffccaa"],
  "Dungeon / Cave": ["#1d2b53", "#83769c", "#5f574f", "#c2c3c7"],
  Cyberpunk: ["#1d2b53", "#ff77a8", "#7e2553", "#29adff"],
  "Sci-Fi": ["#5f574f", "#29adff", "#1d2b53", "#c2c3c7"],
};
export const uid = () => globalThis.crypto.randomUUID();
export const blankPixels = (w, h) => Array(w * h).fill(-1);
export const clone = (value) => structuredClone(value);
export const makeCel = (w, h) => ({ pixels: blankPixels(w, h), tiles: {} });
export const makeLayer = (name, ratio = 1) => ({
  id: uid(),
  name,
  visible: true,
  locked: false,
  opacity: 1,
  blend: "source-over",
  clip: false,
  ratio,
});
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const mod = (n, size) => ((n % size) + size) % size;

export function nearestColor(hex, palette) {
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const target = rgb(hex);
  let distance = Infinity,
    result = 0;
  palette.forEach((color, index) => {
    const d = rgb(color).reduce((sum, c, i) => sum + (c - target[i]) ** 2, 0);
    if (d < distance) {
      distance = d;
      result = index;
    }
  });
  return result;
}

export function createProject({
  name = "Untitled sprite",
  mode = "sprite",
  width = 32,
  height = 32,
  palette = "PICO-8",
  archetype = "Knight",
  sample = false,
} = {}) {
  const colors = [...PALETTES[palette]];
  const layers =
    mode === "background"
      ? [
          makeLayer("Far background", 0.1),
          makeLayer("Midground", 0.3),
          makeLayer("Foreground", 1),
        ]
      : [makeLayer("Artwork")];
  const project = {
    version: VERSION,
    name,
    mode,
    width,
    height,
    palette: colors,
    paletteName: palette,
    paletteLocked: true,
    layers,
    frames: [
      {
        id: uid(),
        duration: 125,
        tag: "idle",
        cels: Object.fromEntries(
          layers.map((l) => [l.id, makeCel(width, height)]),
        ),
        pose: {},
      },
    ],
    rig: [],
    fps: 8,
    interpolation: "stepped",
    pixelSnap: true,
    tileSize: 8,
    tileRule: "47",
    theme: "Grassland",
    wrapX: false,
    wrapY: false,
  };
  if (mode === "puppet")
    project.rig = createRig(archetype, width, height, colors);
  if (mode === "background" && sample) seedBackground(project);
  if (mode === "sprite" && sample) {
    project.frames[0].cels[layers[0].id].pixels = spritePixels(
      width,
      height,
      colors,
      "Sprout",
    );
    for (let i = 1; i < 3; i++) {
      const frame = clone(project.frames[0]);
      frame.id = uid();
      frame.cels[layers[0].id].pixels = spritePixels(
        width,
        height,
        colors,
        "Sprout",
        i,
      );
      project.frames.push(frame);
    }
  }
  return project;
}

export function spritePixels(
  width,
  height,
  palette,
  type = "Sprout",
  phase = 0,
) {
  const pixels = blankPixels(width, height);
  const patterns = {
    Sprout: [
      ".....gg.........",
      ".....glg..gg....",
      "......glgglg....",
      ".......gglg.....",
      "....dddddddd....",
      "...dllllllll d..".replace(" ", ""),
      "..dlllllllllld..",
      "..dllwllllwlld..",
      "..dllkllllklld..",
      "..dlllllllllld..",
      "...dlllkkllld...",
      "....dddddddd....",
    ],
    Crystal: [
      ".......s........",
      "......scs.......",
      ".....sccws......",
      "....sccwwcs.....",
      "...scccwwccs....",
      "...scccwcccs....",
      "....scccccs.....",
      ".....scccs......",
      "......scs.......",
      ".......s........",
    ],
    Heart: [
      "...rr...rr......",
      "..rpp rrppr.....".replace(" ", ""),
      "..rpppppppr.....",
      "..rpppppppr.....",
      "...rpppppr......",
      "....rpppr.......",
      ".....rpr........",
      "......r.........",
    ],
  };
  const mapping = {
    g: "#008751",
    l: "#00e436",
    d: "#1d2b53",
    w: "#fff1e8",
    k: "#000000",
    s: "#83769c",
    c: "#29adff",
    r: "#7e2553",
    p: "#ff77a8",
  };
  const pattern = patterns[type] || patterns.Sprout;
  const scale = Math.max(1, Math.floor(Math.min(width, height) / 24));
  const ox = Math.floor((width - 16 * scale) / 2),
    oy =
      Math.floor((height - pattern.length * scale) / 2) - (phase === 1 ? 1 : 0);
  pattern.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (!mapping[c]) return;
      const color = nearestColor(
        phase === 2 && c === "w" ? mapping.l : mapping[c],
        palette,
      );
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) {
          const px = ox + x * scale + dx,
            py = oy + y * scale + dy;
          if (px >= 0 && py >= 0 && px < width && py < height)
            pixels[py * width + px] = color;
        }
    }),
  );
  return pixels;
}

export function createRig(archetype, width, height, palette) {
  const s = Math.max(1, Math.floor(Math.min(width, height) / 36));
  const skin = archetype === "Goblin" ? "#00e436" : "#ffccaa";
  const outfit =
    archetype === "Knight"
      ? "#c2c3c7"
      : archetype === "Humanoid female"
        ? "#ff77a8"
        : "#29adff";
  const parts = [];
  const part = (
    id,
    name,
    parent,
    x,
    y,
    w,
    h,
    px,
    py,
    color,
    style = "plain",
  ) => {
    const p = {
      id,
      name,
      parent,
      x: x * s,
      y: y * s,
      width: w * s,
      height: h * s,
      pivotX: px * s,
      pivotY: py * s,
      pixels: blankPixels(w * s, h * s),
      style,
    };
    const outline = nearestColor("#1d2b53", palette),
      fill = nearestColor(color, palette),
      light = nearestColor("#fff1e8", palette);
    for (let iy = 0; iy < p.height; iy++)
      for (let ix = 0; ix < p.width; ix++) {
        const edge =
          ix < s || ix >= p.width - s || iy < s || iy >= p.height - s;
        p.pixels[iy * p.width + ix] = edge ? outline : fill;
        if (
          style === "head" &&
          iy === Math.floor(p.height * 0.55) &&
          (ix === 3 * s || ix === p.width - 4 * s)
        )
          p.pixels[iy * p.width + ix] = outline;
        if (style === "armor" && ix === s && iy > s && iy < p.height - s)
          p.pixels[iy * p.width + ix] = light;
      }
    parts.push(p);
    return p;
  };
  const torso = part(
    "torso",
    "Torso",
    null,
    0,
    0,
    archetype === "Quadruped" ? 15 : 8,
    9,
    4,
    2,
    outfit,
    "armor",
  );
  torso.x = Math.floor(width / 2);
  torso.y = Math.floor(height * 0.42);
  part(
    "head",
    "Head",
    "torso",
    4,
    0,
    archetype === "Goblin" ? 14 : 12,
    11,
    6,
    9,
    skin,
    "head",
  );
  for (const [side, x] of [
    ["left", 0],
    ["right", 8],
  ]) {
    part(`${side}-arm`, `${side} upper arm`, "torso", x, 2, 4, 6, 2, 1, outfit);
    part(
      `${side}-forearm`,
      `${side} forearm`,
      `${side}-arm`,
      2,
      5,
      3,
      5,
      1,
      1,
      skin,
    );
    part(
      `${side}-hand`,
      `${side} hand`,
      `${side}-forearm`,
      1,
      4,
      3,
      3,
      1,
      1,
      skin,
    );
    part(
      `${side}-leg`,
      `${side} leg`,
      "torso",
      side === "left" ? 2 : 6,
      8,
      4,
      6,
      2,
      1,
      outfit,
    );
    part(
      `${side}-foot`,
      `${side} foot`,
      `${side}-leg`,
      2,
      5,
      5,
      3,
      2,
      1,
      "#ab5236",
    );
  }
  if (archetype === "Quadruped") {
    parts[1].x = 1 * s;
    parts[1].y = 3 * s;
    for (const p of parts.filter(
      (p) => p.parent === "torso" && p.id !== "head",
    )) {
      p.x = (p.id.startsWith("left") ? 3 : 13) * s;
      p.y = 7 * s;
    }
  }
  // Keep the complete base usable on the 16 px preset and custom tiny canvases.
  const shrink = Math.min(1, Math.min(width, height) / 32);
  if (shrink < 1)
    for (const p of parts) {
      const oldWidth = p.width,
        oldHeight = p.height,
        oldPixels = p.pixels;
      p.width = Math.max(1, Math.round(oldWidth * shrink));
      p.height = Math.max(1, Math.round(oldHeight * shrink));
      p.pixels = Array.from(
        { length: p.width * p.height },
        (_, i) =>
          oldPixels[
            Math.min(
              oldHeight - 1,
              Math.floor(Math.floor(i / p.width) / shrink),
            ) *
              oldWidth +
              Math.min(oldWidth - 1, Math.floor((i % p.width) / shrink))
          ],
      );
      p.pivotX = Math.min(p.width, Math.round(p.pivotX * shrink));
      p.pivotY = Math.min(p.height, Math.round(p.pivotY * shrink));
      if (p.parent) {
        p.x = Math.round(p.x * shrink);
        p.y = Math.round(p.y * shrink);
      }
    }
  return parts;
}

export function seedBackground(project) {
  const { width: w, height: h, palette, layers, frames } = project;
  const sky = frames[0].cels[layers[0].id].pixels;
  const mountains = frames[0].cels[layers[1].id].pixels;
  const top = nearestColor("#1d2b53", palette),
    light = nearestColor("#29adff", palette),
    green = nearestColor("#008751", palette);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      sky[y * w + x] = y < h / 2 ? top : light;
      if (y > h * 0.55 + Math.sin((x / w) * Math.PI * 4) * h * 0.15)
        mountains[y * w + x] = green;
    }
  const tiles = frames[0].cels[layers[2].id].tiles;
  for (
    let y = Math.floor((h / project.tileSize) * 0.75);
    y < Math.ceil(h / project.tileSize);
    y++
  )
    for (let x = 0; x < Math.ceil(w / project.tileSize); x++)
      tiles[`${x},${y}`] = 1;
}

export function linePoints(a, b) {
  let [x, y] = a;
  const [bx, by] = b,
    dx = Math.abs(bx - x),
    dy = -Math.abs(by - y),
    sx = x < bx ? 1 : -1,
    sy = y < by ? 1 : -1;
  let error = dx + dy;
  const points = [];
  while (true) {
    points.push([x, y]);
    if (x === bx && y === by) break;
    const e = 2 * error;
    if (e >= dy) {
      error += dy;
      x += sx;
    }
    if (e <= dx) {
      error += dx;
      y += sy;
    }
  }
  return points;
}

export function paint(pixels, width, height, points, options) {
  const {
    color,
    secondary = -1,
    size = 1,
    mirrorX = false,
    mirrorY = false,
    wrapX = false,
    wrapY = false,
    dither = false,
    pattern = "",
  } = options;
  const put = (x, y) => {
    if (wrapX) x = mod(x, width);
    if (wrapY) y = mod(y, height);
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    let value = color;
    if (dither && (x + y) % 2) value = secondary;
    if (pattern === "Brick")
      value =
        y % 4 === 0 || mod(x + (Math.floor(y / 4) % 2) * 4, 8) === 0
          ? secondary
          : color;
    if (pattern === "Stone")
      value = mod(x * 7 + y * 11 + x * y, 13) < 3 ? secondary : color;
    if (pattern === "Leaves") value = mod(x + y * 3, 7) < 2 ? secondary : color;
    pixels[y * width + x] = value;
  };
  for (const [px, py] of points)
    for (let dy = 0; dy < size; dy++)
      for (let dx = 0; dx < size; dx++) {
        const x = px + dx - Math.floor((size - 1) / 2),
          y = py + dy - Math.floor((size - 1) / 2);
        put(x, y);
        if (mirrorX) put(width - 1 - x, y);
        if (mirrorY) put(x, height - 1 - y);
        if (mirrorX && mirrorY) put(width - 1 - x, height - 1 - y);
      }
}

export function floodFill(pixels, w, h, x, y, options) {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const target = pixels[y * w + x],
    seen = new Uint8Array(w * h),
    stack = [[x, y]],
    points = [];
  while (stack.length) {
    let [px, py] = stack.pop();
    if (options.wrapX) px = mod(px, w);
    if (options.wrapY) py = mod(py, h);
    if (px < 0 || py < 0 || px >= w || py >= h) continue;
    const i = py * w + px;
    if (seen[i] || pixels[i] !== target) continue;
    seen[i] = 1;
    points.push([px, py]);
    stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
  }
  paint(pixels, w, h, points, { ...options, size: 1 });
}

// Clockwise cardinal bits: N=1, E=2, S=4, W=8. Diagonals only
// connect when both adjacent cardinal neighbors are present (47-tile blob).
export function tileMask(
  tiles,
  x,
  y,
  rule,
  columns,
  rows,
  wrapX = false,
  wrapY = false,
) {
  const has = (dx, dy) =>
    !!tiles[
      `${wrapX ? mod(x + dx, columns) : x + dx},${wrapY ? mod(y + dy, rows) : y + dy}`
    ];
  let mask =
    (has(0, -1) ? 1 : 0) |
    (has(1, 0) ? 2 : 0) |
    (has(0, 1) ? 4 : 0) |
    (has(-1, 0) ? 8 : 0);
  if (rule === "47") {
    if ((mask & 3) === 3 && has(1, -1)) mask |= 16;
    if ((mask & 6) === 6 && has(1, 1)) mask |= 32;
    if ((mask & 12) === 12 && has(-1, 1)) mask |= 64;
    if ((mask & 9) === 9 && has(-1, -1)) mask |= 128;
  }
  return mask;
}

export function tileVariants(rule) {
  if (rule !== "47") return Array.from({ length: 16 }, (_, i) => i);
  return Array.from({ length: 256 }, (_, i) => i).filter(
    (m) =>
      (!(m & 16) || (m & 3) === 3) &&
      (!(m & 32) || (m & 6) === 6) &&
      (!(m & 64) || (m & 12) === 12) &&
      (!(m & 128) || (m & 9) === 9),
  );
}

export function swapPalette(project, palette, name, remap = false) {
  const mapping = project.palette.map((color, i) =>
    remap ? nearestColor(color, palette) : i % palette.length,
  );
  const convert = (pixels) => pixels.map((p) => (p < 0 ? -1 : mapping[p]));
  for (const frame of project.frames)
    for (const cel of Object.values(frame.cels))
      cel.pixels = convert(cel.pixels);
  for (const part of project.rig) part.pixels = convert(part.pixels);
  project.palette = [...palette];
  project.paletteName = name;
}

export function parsePalette(text) {
  const lines = text.trim().split(/\r?\n/);
  let colors;
  if (lines[0] === "GIMP Palette" || lines[0] === "JASC-PAL") {
    colors = lines
      .slice(lines[0] === "JASC-PAL" ? 3 : 1)
      .filter((l) => /^\s*\d+\s+\d+\s+\d+/.test(l))
      .map((l) => {
        const rgb = l.trim().split(/\s+/).slice(0, 3).map(Number);
        if (rgb.some((v) => !Number.isInteger(v) || v < 0 || v > 255))
          throw new Error("Palette values must be between 0 and 255.");
        return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
      });
  } else
    colors = lines
      .filter((l) => /^#?[0-9a-f]{6}$/i.test(l.trim()))
      .map((l) => "#" + l.trim().replace("#", "").toLowerCase());
  if (!colors.length || colors.length > 256)
    throw new Error(
      "Choose a palette with 1–256 colors in HEX, GPL, or JASC-PAL format.",
    );
  return colors;
}

export function paletteText(colors, format) {
  const rgb = colors.map((c) =>
    [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)).join(" "),
  );
  if (format === "gpl")
    return `GIMP Palette\nName: Pixel Studio\nColumns: 8\n#\n${rgb.join("\n")}\n`;
  if (format === "pal")
    return `JASC-PAL\n0100\n${colors.length}\n${rgb.join("\n")}\n`;
  return colors.map((c) => c.slice(1)).join("\n") + "\n";
}

export function frameAt(project, time) {
  const total = project.frames.reduce((n, f) => n + f.duration, 0);
  let t = mod(time, total);
  if (project.interpolation === "stepped" && project.mode === "puppet")
    t = (Math.floor((t * project.fps) / 1000) * 1000) / project.fps;
  for (let i = 0; i < project.frames.length; i++) {
    if (t < project.frames[i].duration)
      return { index: i, progress: t / project.frames[i].duration };
    t -= project.frames[i].duration;
  }
  return { index: 0, progress: 0 };
}

export function interpolatedPose(project, index, progress = 0) {
  const a = project.frames[index].pose,
    b = project.frames[(index + 1) % project.frames.length].pose;
  return Object.fromEntries(
    project.rig.map((part) => {
      const start = a[part.id] || 0,
        end = b[part.id] || 0;
      return [part.id, start + (mod(end - start + 180, 360) - 180) * progress];
    }),
  );
}

export function boneTransforms(project, pose) {
  const transforms = {};
  const calculate = (part) => {
    if (transforms[part.id]) return transforms[part.id];
    const parent = project.rig.find((p) => p.id === part.parent);
    const base = parent ? calculate(parent) : null;
    const angle = (base?.angle || 0) + ((pose[part.id] || 0) * Math.PI) / 180;
    let x = part.x,
      y = part.y;
    if (base) {
      x =
        base.x +
        (part.x - parent.pivotX) * Math.cos(base.angle) -
        (part.y - parent.pivotY) * Math.sin(base.angle);
      y =
        base.y +
        (part.x - parent.pivotX) * Math.sin(base.angle) +
        (part.y - parent.pivotY) * Math.cos(base.angle);
    }
    if (project.pixelSnap) {
      x = Math.round(x);
      y = Math.round(y);
    }
    return (transforms[part.id] = { x, y, angle });
  };
  project.rig.forEach(calculate);
  return transforms;
}

// Imported projects are untrusted. Bound allocations and reject malformed
// references before a project reaches drawing, hierarchy traversal, or storage.
export function validateProject(p) {
  const fail = () => {
    throw new Error(
      "This is not a valid Pixel Studio project, or it exceeds the project limits.",
    );
  };
  const integer = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;
  const finite = (n, a, b) => Number.isFinite(n) && n >= a && n <= b;
  const string = (s, limit = 100) =>
    typeof s === "string" && s.length > 0 && s.length <= limit;
  const identifier = (s) =>
    string(s) &&
    /^[a-z0-9_-]+$/i.test(s) &&
    !["__proto__", "constructor", "prototype"].includes(s);
  if (
    !p ||
    p.version !== VERSION ||
    !["sprite", "puppet", "background"].includes(p.mode) ||
    !string(p.name) ||
    !integer(p.width, 1, 512) ||
    !integer(p.height, 1, 512)
  )
    fail();
  if (
    !Array.isArray(p.palette) ||
    !integer(p.palette.length, 1, 256) ||
    p.palette.some((c) => !/^#[0-9a-f]{6}$/i.test(c))
  )
    fail();
  if (
    !Array.isArray(p.layers) ||
    !integer(p.layers.length, 1, 16) ||
    !Array.isArray(p.frames) ||
    !integer(p.frames.length, 1, 64) ||
    p.width * p.height * p.layers.length * p.frames.length > MAX_PIXELS
  )
    fail();
  const ids = new Set(p.layers.map((l) => l.id));
  if (
    ids.size !== p.layers.length ||
    new Set(p.frames.map((f) => f.id)).size !== p.frames.length
  )
    fail();
  for (const l of p.layers)
    if (
      !identifier(l.id) ||
      !string(l.name) ||
      !finite(l.opacity, 0, 1) ||
      !finite(l.ratio, 0, 2) ||
      !["source-over", "multiply", "screen", "overlay", "lighter"].includes(
        l.blend,
      ) ||
      ["visible", "locked", "clip"].some((k) => typeof l[k] !== "boolean")
    )
      fail();
  if (
    !string(p.paletteName) ||
    typeof p.paletteLocked !== "boolean" ||
    typeof p.wrapX !== "boolean" ||
    typeof p.wrapY !== "boolean"
  )
    fail();
  if (
    ![8, 12, 24].includes(p.fps) ||
    !["stepped", "smooth"].includes(p.interpolation) ||
    ![8, 16, 32].includes(p.tileSize) ||
    !["16", "47", "wang"].includes(p.tileRule) ||
    !Object.hasOwn(THEMES, p.theme) ||
    typeof p.pixelSnap !== "boolean"
  )
    fail();
  const pixels = (arr, length) =>
    Array.isArray(arr) &&
    arr.length === length &&
    arr.every((v) => integer(v, -1, p.palette.length - 1));
  if (!Array.isArray(p.rig) || p.rig.length > 32) fail();
  const partIds = new Set(p.rig.map((part) => part.id));
  if (partIds.size !== p.rig.length || (p.mode === "puppet" && !p.rig.length))
    fail();
  for (const part of p.rig) {
    if (
      !identifier(part.id) ||
      !string(part.name) ||
      !integer(part.width, 1, 256) ||
      !integer(part.height, 1, 256) ||
      !pixels(part.pixels, part.width * part.height) ||
      !finite(part.x, -1024, 1024) ||
      !finite(part.y, -1024, 1024) ||
      !finite(part.pivotX, 0, part.width) ||
      !finite(part.pivotY, 0, part.height) ||
      (part.parent !== null && !partIds.has(part.parent))
    )
      fail();
    let current = part,
      seen = new Set();
    while (current) {
      if (seen.has(current.id)) fail();
      seen.add(current.id);
      current = p.rig.find((r) => r.id === current.parent);
    }
  }
  for (const f of p.frames) {
    if (
      !identifier(f.id) ||
      !integer(f.duration, 20, 10000) ||
      typeof f.tag !== "string" ||
      f.tag.length > 40 ||
      !f.cels ||
      !f.pose ||
      typeof f.pose !== "object" ||
      Array.isArray(f.pose) ||
      Object.keys(f.cels).length !== ids.size
    )
      fail();
    if (
      Object.keys(f.pose).some(
        (id) => !partIds.has(id) || !finite(f.pose[id], -360, 360),
      )
    )
      fail();
    for (const id of ids) {
      const c = f.cels[id];
      if (
        !c ||
        !pixels(c.pixels, p.width * p.height) ||
        !c.tiles ||
        typeof c.tiles !== "object" ||
        Array.isArray(c.tiles)
      )
        fail();
      for (const [key, value] of Object.entries(c.tiles)) {
        if (!/^\d+,\d+$/.test(key) || value !== 1) fail();
        const [x, y] = key.split(",").map(Number);
        if (
          x >= Math.ceil(p.width / p.tileSize) ||
          y >= Math.ceil(p.height / p.tileSize)
        )
          fail();
      }
    }
  }
  return clone(p);
}
