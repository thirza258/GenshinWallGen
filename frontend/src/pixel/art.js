// Small deterministic drawing primitives for editable, indexed library artwork.
export const STORY_COLORS = {
  ink: "#292838",
  navy: "#38445f",
  blue: "#638fba",
  sky: "#a5d5df",
  cream: "#fff0d7",
  white: "#fffaf0",
  steel: "#aebccc",
  silver: "#d6dae0",
  purple: "#816594",
  lavender: "#b7a0c9",
  rose: "#df8da3",
  pink: "#f5c4cf",
  red: "#b95162",
  copper: "#b86e4b",
  brown: "#78503e",
  black: "#38323b",
  green: "#53785b",
  leaf: "#89aa75",
  mint: "#b7cba2",
  gold: "#e1b568",
  sand: "#efd3a3",
  light: "#f6d0ae",
  tan: "#dc9b72",
  medium: "#a96c50",
  deep: "#714735",
  plum: "#644565",
  dusk: "#b17b93",
  peach: "#efb298",
  water: "#6aa9b0",
  teal: "#46787d",
  moss: "#354f45",
  wood: "#a57c5b",
};

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

export function pixelArt(width, height, palette) {
  const pixels = Array(width * height).fill(-1);
  const colors = new Map();
  const color = (value) => {
    if (typeof value === "number") return value;
    if (!colors.has(value)) colors.set(value, nearestColor(value, palette));
    return colors.get(value);
  };
  const dot = (x, y, fill) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < width && y < height)
      pixels[y * width + x] = color(fill);
  };
  const rect = (x, y, w, h, fill) => {
    const index = color(fill);
    for (
      let py = Math.max(0, Math.round(y));
      py < Math.min(height, Math.round(y + h));
      py++
    )
      for (
        let px = Math.max(0, Math.round(x));
        px < Math.min(width, Math.round(x + w));
        px++
      )
        pixels[py * width + px] = index;
  };
  const ellipse = (x, y, w, h, fill) => {
    for (let py = Math.floor(y); py < y + h; py++)
      for (let px = Math.floor(x); px < x + w; px++)
        if (
          ((px + 0.5 - x - w / 2) / (w / 2)) ** 2 +
            ((py + 0.5 - y - h / 2) / (h / 2)) ** 2 <=
          1
        )
          dot(px, py, fill);
  };
  const line = (x1, y1, x2, y2, fill) => {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    for (let i = 0; i <= steps; i++)
      dot(x1 + ((x2 - x1) * i) / steps, y1 + ((y2 - y1) * i) / steps, fill);
  };
  const triangle = (x, y, w, h, fill) => {
    for (let row = 0; row < h; row++) {
      const span = Math.max(1, Math.round((w * (row + 1)) / h));
      rect(x + Math.floor((w - span) / 2), y + row, span, 1, fill);
    }
  };
  return { pixels, dot, rect, ellipse, line, triangle };
}

export function resizePixels(pixels, width, height, nextWidth, nextHeight) {
  return Array.from(
    { length: nextWidth * nextHeight },
    (_, i) =>
      pixels[
        Math.min(
          height - 1,
          Math.floor((Math.floor(i / nextWidth) * height) / nextHeight),
        ) *
          width +
          Math.min(width - 1, Math.floor(((i % nextWidth) * width) / nextWidth))
      ],
  );
}
