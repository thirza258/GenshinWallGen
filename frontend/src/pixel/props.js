import { pixelArt, STORY_COLORS as C } from "./art.js";

export function propPixels(id, width, height, palette, phase = 0) {
  const a = pixelArt(16, 16, palette);
  switch (id) {
    case "potion":
      a.rect(6, 1, 4, 3, C.brown);
      a.rect(5, 4, 6, 2, C.ink);
      a.ellipse(3, 5, 10, 10, C.ink);
      a.ellipse(4, 5, 8, 9, C.sky);
      a.ellipse(4, 8, 8, 6, C.purple);
      a.rect(5, 7, 2, 4, C.white);
      a.dot(9, 11, C.pink);
      break;
    case "spellbook":
      a.rect(2, 2, 12, 13, C.ink);
      a.rect(3, 2, 10, 11, C.purple);
      a.rect(3, 13, 10, 1, C.cream);
      a.rect(3, 2, 2, 11, C.gold);
      a.line(9, 5, 9, 10, C.gold);
      a.line(7, 7, 11, 7, C.gold);
      break;
    case "treasure-chest":
      a.ellipse(1, 3, 14, 10, C.ink);
      a.rect(1, 7, 14, 7, C.ink);
      a.rect(2, 7, 12, 6, C.brown);
      a.ellipse(2, 4, 12, 7, C.wood);
      a.rect(1, 9, 14, 2, C.gold);
      a.rect(3, 5, 1, 8, C.gold);
      a.rect(11, 5, 1, 8, C.gold);
      a.rect(7, 9, 3, 3, C.cream);
      a.dot(8, 10, C.ink);
      break;
    case "lantern":
      a.ellipse(5, 0, 6, 6, C.ink);
      a.ellipse(6, 1, 4, 4, -1);
      a.triangle(2, 3, 12, 4, C.navy);
      a.rect(3, 6, 10, 8, C.ink);
      a.rect(4, 7, 8, 6, C.gold);
      a.rect(6, 8, 4, 5, C.cream);
      a.rect(3, 13, 10, 2, C.navy);
      a.rect(7, 6, 1, 8, C.brown);
      break;
    case "coffee-cup":
      a.line(6, 1, 5, 3, C.steel);
      a.line(9, 0, 8, 3, C.steel);
      a.rect(11, 6, 4, 6, C.cream);
      a.rect(12, 7, 2, 3, -1);
      a.rect(2, 5, 10, 8, C.ink);
      a.rect(3, 6, 8, 6, C.cream);
      a.rect(4, 6, 6, 2, C.brown);
      a.rect(1, 14, 13, 1, C.steel);
      a.rect(4, 13, 7, 1, C.white);
      a.dot(5, 9, C.rose);
      break;
    case "cat":
      a.ellipse(3, 8, 10, 7, C.copper);
      a.triangle(3, 1, 4, 6, C.copper);
      a.triangle(9, 1, 4, 6, C.copper);
      a.ellipse(2, 4, 12, 8, C.gold);
      a.dot(5, 7, C.ink);
      a.dot(10, 7, C.ink);
      a.dot(7, 9, C.red);
      a.rect(6, 11, 4, 3, C.cream);
      a.rect(13, 10, 2, 4, C.copper);
      a.rect(14, 8, 1, 3, C.copper);
      a.dot(5, 14, C.brown);
      a.dot(10, 14, C.brown);
      break;
    case "bento-box":
      a.rect(1, 3, 14, 11, C.ink);
      a.rect(2, 4, 12, 9, C.red);
      a.rect(3, 5, 6, 7, C.cream);
      a.dot(6, 8, C.red);
      a.rect(10, 5, 3, 3, C.leaf);
      a.rect(10, 9, 3, 3, C.gold);
      a.line(2, 1, 13, 0, C.wood);
      a.line(2, 2, 13, 1, C.wood);
      break;
    case "school-bag":
      a.rect(5, 1, 6, 4, C.ink);
      a.rect(6, 2, 4, 2, -1);
      a.rect(2, 4, 12, 11, C.ink);
      a.rect(3, 5, 10, 9, C.blue);
      a.rect(3, 5, 10, 4, C.navy);
      a.rect(5, 10, 6, 3, C.navy);
      a.rect(7, 7, 2, 3, C.gold);
      a.rect(1, 7, 1, 6, C.brown);
      break;
    case "bouquet":
      a.triangle(4, 8, 8, 7, C.cream);
      a.line(5, 5, 8, 13, C.green);
      a.line(11, 5, 8, 13, C.green);
      a.ellipse(2, 4, 5, 5, C.leaf);
      a.ellipse(9, 4, 5, 5, C.green);
      for (const [x, y, color] of [
        [3, 2, C.rose],
        [7, 1, C.red],
        [10, 3, C.pink],
        [6, 5, C.rose],
      ]) {
        a.ellipse(x, y, 5, 5, color);
        a.dot(x + 2, y + 2, C.cream);
      }
      a.rect(6, 11, 4, 2, C.red);
      break;
    case "love-letter":
      a.rect(1, 4, 14, 10, C.wood);
      a.rect(2, 5, 12, 8, C.cream);
      a.line(2, 5, 8, 10, C.sand);
      a.line(13, 5, 8, 10, C.sand);
      a.rect(6, 8, 2, 2, C.red);
      a.rect(9, 8, 2, 2, C.red);
      a.rect(7, 9, 3, 2, C.red);
      a.dot(8, 11, C.red);
      break;
    case "umbrella":
      a.line(8, 4, 8, 14, C.brown);
      a.rect(6, 14, 3, 1, C.brown);
      a.dot(6, 13, C.brown);
      a.ellipse(1, 1, 14, 13, C.red);
      a.rect(0, 8, 16, 5, -1);
      a.line(8, 7, 8, 13, C.brown);
      a.ellipse(4, 2, 8, 11, C.rose);
      a.rect(3, 8, 10, 5, -1);
      a.line(8, 8, 8, 13, C.brown);
      a.rect(7, 2, 2, 6, C.pink);
      a.dot(8, 0, C.brown);
      break;
    case "gift-box":
      a.rect(2, 5, 12, 10, C.red);
      a.rect(3, 6, 10, 8, C.rose);
      a.rect(1, 5, 14, 3, C.pink);
      a.rect(7, 5, 2, 10, C.gold);
      a.ellipse(3, 1, 5, 4, C.gold);
      a.ellipse(8, 1, 5, 4, C.gold);
      a.dot(5, 2, -1);
      a.dot(10, 2, -1);
      break;
    default:
      throw new Error(`Unknown prop: ${id}`);
  }
  const result = Array(width * height).fill(-1);
  const scale = Math.max(1, Math.floor(Math.min(width, height) / 24));
  const size = Math.min(16 * scale, width, height);
  const ox = Math.floor((width - size) / 2),
    oy = Math.max(0, Math.floor((height - size) / 2) - (phase % 2));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      result[(y + oy) * width + x + ox] =
        a.pixels[
          Math.floor((y * 16) / size) * 16 + Math.floor((x * 16) / size)
        ];
  return result;
}
