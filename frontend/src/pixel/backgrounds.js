import { pixelArt, resizePixels, STORY_COLORS as C } from "./art.js";

// Each scene is painted on three independent 128 × 72 pixel planes.
// Keeping the artwork as indices makes every scene editable and palette-aware.
export function backgroundLayers(scene, width, height, palette) {
  const far = pixelArt(128, 72, palette),
    mid = pixelArt(128, 72, palette),
    front = pixelArt(128, 72, palette);
  const sky = (colors) =>
    colors.forEach((color, i) => far.rect(0, i * 18, 128, 18, color));
  const stars = () => {
    for (let i = 0; i < 25; i++)
      far.dot((i * 37 + 5) % 128, (i * 11 + 3) % 35, i % 3 ? C.cream : C.rose);
  };
  const clouds = () => {
    for (const [x, y] of [
      [5, 10],
      [54, 5],
      [99, 19],
    ]) {
      far.ellipse(x + 4, y - 2, 15, 6, C.white);
      far.rect(x, y + 1, 26, 3, C.cream);
    }
  };
  const hills = (color, baseline = 46) => {
    for (let x = 0; x < 128; x++) {
      const top = Math.round(
        baseline + Math.sin(x / 17) * 5 + Math.cos(x / 9) * 3,
      );
      mid.rect(x, top, 1, 72 - top, color);
    }
  };
  const ground = (color = C.green, trim = C.leaf, top = 58) => {
    front.rect(0, top, 128, 72 - top, color);
    front.rect(0, top, 128, 2, trim);
    for (let i = 0; i < 35; i++)
      front.rect(
        (i * 19) % 128,
        top + 4 + (i % Math.max(1, 68 - top)),
        2,
        1,
        trim,
      );
  };
  const tree = (a, x, y, size = 1, pink = false) => {
    a.rect(x + 9 * size, y + 12 * size, 3 * size, 18 * size, C.brown);
    a.line(x + 10 * size, y + 22 * size, x + 5 * size, y + 15 * size, C.brown);
    a.ellipse(x, y + 5 * size, 23 * size, 16 * size, pink ? C.dusk : C.moss);
    a.ellipse(x + 3 * size, y, 17 * size, 19 * size, pink ? C.rose : C.green);
    a.ellipse(
      x + 1 * size,
      y + 5 * size,
      16 * size,
      10 * size,
      pink ? C.pink : C.leaf,
    );
    for (let i = 0; i < 7; i++)
      a.rect(
        x + 4 * size + ((i * 7) % (14 * size)),
        y + 5 * size + ((i * 3) % (8 * size)),
        2,
        1,
        pink ? C.white : C.mint,
      );
  };
  const window = (a, x, y, w = 8, h = 10, glow = C.sky) => {
    a.rect(x, y, w, h, C.brown);
    a.rect(x + 1, y + 1, w - 2, h - 2, glow);
    a.rect(x + Math.floor(w / 2), y, 1, h, C.cream);
    a.rect(x, y + Math.floor(h / 2), w, 1, C.cream);
  };
  const house = (a, x, y, w, h, wall = C.sand, roof = C.red) => {
    a.rect(x, y, w, h, C.brown);
    a.rect(x + 1, y + 1, w - 2, h - 1, wall);
    a.triangle(x - 3, y - 12, w + 6, 14, C.brown);
    a.triangle(x - 1, y - 11, w + 2, 11, roof);
    a.rect(x + w - 7, y - 11, 4, 7, C.brown);
    window(a, x + 4, y + 5, 8, 9, C.gold);
    a.rect(x + w - 11, y + h - 15, 7, 15, C.brown);
    a.dot(x + w - 9, y + h - 7, C.gold);
    a.rect(x + 1, y + h - 2, w - 2, 2, C.wood);
  };
  const bench = (a, x, y) => {
    a.rect(x, y, 23, 3, C.brown);
    a.rect(x, y + 4, 23, 3, C.wood);
    a.rect(x - 1, y + 8, 25, 3, C.brown);
    a.rect(x + 2, y + 11, 2, 5, C.ink);
    a.rect(x + 19, y + 11, 2, 5, C.ink);
  };
  const lamp = (a, x, y) => {
    a.rect(x + 3, y + 8, 2, 28, C.ink);
    a.rect(x, y + 2, 8, 9, C.ink);
    a.rect(x + 1, y + 3, 6, 6, C.gold);
    a.rect(x + 2, y + 3, 2, 5, C.cream);
    a.triangle(x - 1, y - 1, 10, 4, C.ink);
    a.rect(x + 1, y + 34, 6, 2, C.ink);
  };
  const flowers = (a, x, y, count = 8) => {
    for (let i = 0; i < count; i++) {
      const px = x + i * 7,
        py = y + (i % 3);
      a.rect(px, py, 1, 4, C.green);
      a.rect(px - 1, py - 1, 3, 2, i % 2 ? C.rose : C.gold);
      a.dot(px, py - 1, C.cream);
    }
  };
  const skyline = (a, color = C.lavender) => {
    for (let i = 0; i < 13; i++) {
      const h = 10 + ((i * 7) % 17);
      a.rect(i * 11, 51 - h, 9, h, color);
      for (let y = 54 - h; y < 48; y += 5) a.rect(i * 11 + 3, y, 2, 2, C.cream);
    }
  };
  const shelves = (a, x, y, w, h) => {
    a.rect(x, y, w, h, C.brown);
    a.rect(x + 2, y + 2, w - 4, h - 3, C.navy);
    for (let row = 0; row < Math.floor(h / 12); row++) {
      for (let col = 0; col < Math.floor((w - 4) / 4); col++) {
        const bh = 6 + ((row + col) % 3);
        const color = [C.red, C.leaf, C.gold, C.blue, C.lavender][
          (row * 2 + col) % 5
        ];
        a.rect(x + 3 + col * 4, y + 10 + row * 12 - bh, 3, bh, color);
        a.dot(x + 4 + col * 4, y + 8 + row * 12, C.cream);
      }
      a.rect(x + 1, y + 11 + row * 12, w - 2, 2, C.wood);
    }
  };
  const floor = () => {
    ground(C.wood, C.sand, 54);
    for (let y = 59; y < 72; y += 6) {
      front.rect(0, y, 128, 1, C.brown);
      for (let x = y % 12 ? 0 : 12; x < 128; x += 25)
        front.rect(x, y - 4, 1, 4, C.brown);
    }
  };
  const table = (a, x, y, w = 24) => {
    a.rect(x + 2, y + 4, 2, 10, C.brown);
    a.rect(x + w - 4, y + 4, 2, 10, C.brown);
    a.rect(x, y, w, 3, C.sand);
    a.rect(x, y + 3, w, 2, C.brown);
  };

  let names = ["Sky & light", "Scenery", "Foreground details"];
  switch (scene.setting) {
    case "castle": {
      sky([C.ink, C.navy, C.purple, C.lavender]);
      stars();
      far.ellipse(89, 7, 17, 17, C.cream);
      mid.triangle(-15, 23, 70, 40, C.purple);
      mid.triangle(66, 26, 78, 40, C.plum);
      hills(C.moss, 54);
      mid.rect(39, 31, 48, 25, C.steel);
      for (const x of [33, 75]) {
        mid.rect(x, 22, 19, 35, C.steel);
        mid.triangle(x - 3, 9, 25, 16, C.navy);
        mid.rect(x + 8, 31, 4, 9, C.gold);
        mid.rect(x + 2, 24, 2, 29, C.silver);
        mid.rect(x + 10, 5, 1, 8, C.brown);
        mid.rect(x + 11, 5, 7, 4, C.red);
      }
      mid.rect(55, 42, 13, 15, C.navy);
      mid.ellipse(55, 36, 13, 14, C.navy);
      for (const x of [50, 70]) mid.rect(x, 33, 4, 6, C.gold);
      ground(C.moss, C.green);
      front.triangle(39, 57, 50, 15, C.wood);
      flowers(front, 3, 63, 4);
      break;
    }
    case "forest": {
      sky([C.navy, C.teal, C.green, C.moss]);
      for (const x of [4, 35, 64, 97, 121]) {
        far.rect(x, 0, 5, 61, C.teal);
        far.ellipse(x - 12, 0, 32, 19, C.moss);
      }
      tree(mid, -11, 2, 2);
      tree(mid, 91, -2, 2);
      tree(mid, 37, 12);
      ground(C.moss, C.green);
      front.triangle(45, 52, 38, 23, C.wood);
      for (const [x, y] of [
        [12, 56],
        [25, 62],
        [99, 58],
        [110, 65],
      ]) {
        front.rect(x + 2, y, 2, 5, C.cream);
        front.ellipse(x - 1, y - 4, 8, 6, C.lavender);
        front.dot(x + 1, y - 2, C.white);
      }
      for (let i = 0; i < 16; i++)
        mid.dot((i * 23) % 128, 24 + ((i * 7) % 27), C.gold);
      break;
    }
    case "islands": {
      sky([C.blue, C.sky, C.sky, C.cream]);
      clouds();
      for (const [x, y, w] of [
        [8, 27, 36],
        [68, 18, 48],
        [51, 49, 24],
      ]) {
        for (let row = 0; row < 15; row++)
          mid.rect(
            x + row,
            y + row,
            w - row * 2,
            1,
            row < 3 ? C.leaf : C.brown,
          );
        mid.rect(x, y, w, 2, C.mint);
      }
      tree(mid, 81, -8);
      mid.rect(91, 20, 5, 43, C.water);
      mid.rect(92, 20, 2, 43, C.sky);
      front.ellipse(-15, 60, 78, 20, C.white);
      front.ellipse(73, 64, 80, 18, C.cream);
      front.rect(63, 61, 24, 1, C.white);
      break;
    }
    case "village": {
      sky([C.navy, C.purple, C.dusk, C.peach]);
      stars();
      house(mid, 2, 31, 31, 28, C.sand, C.red);
      house(mid, 48, 24, 34, 35, C.cream, C.green);
      house(mid, 97, 34, 31, 25, C.sand, C.purple);
      ground(C.wood, C.sand, 59);
      front.line(0, 22, 127, 27, C.ink);
      for (let x = 8; x < 128; x += 19) {
        front.rect(x, 24, 1, 5, C.ink);
        front.ellipse(x - 2, 28, 6, 8, C.gold);
        front.rect(x, 29, 2, 5, C.cream);
      }
      lamp(front, 36, 29);
      break;
    }
    case "garden": {
      sky([C.sky, C.sky, C.cream, C.mint]);
      clouds();
      hills(C.leaf, 48);
      house(mid, 48, 30, 37, 29, C.cream, C.red);
      tree(mid, 5, 20);
      tree(mid, 101, 15);
      ground(C.green, C.leaf);
      front.triangle(56, 59, 30, 13, C.sand);
      for (let x = 1; x < 128; x += 7)
        if (x < 47 || x > 87) front.rect(x, 48, 2, 15, C.cream);
      front.rect(0, 51, 46, 2, C.cream);
      front.rect(87, 51, 41, 2, C.cream);
      flowers(front, 5, 64, 6);
      flowers(front, 89, 65, 5);
      break;
    }
    case "bookshop":
    case "library": {
      const library = scene.setting === "library";
      far.rect(0, 0, 128, 72, library ? C.cream : C.sand);
      far.rect(0, 0, 128, 5, C.brown);
      window(far, 49, 10, 30, 35);
      shelves(mid, 4, 9, 36, 45);
      shelves(mid, 88, 9, 36, 45);
      floor();
      table(front, 39, 53, 50);
      front.rect(51, 50, 13, 3, C.cream);
      front.rect(57, 50, 1, 3, C.wood);
      if (!library) {
        front.rect(20, 53, 12, 13, C.red);
        front.rect(18, 60, 16, 7, C.red);
        front.rect(22, 67, 2, 4, C.brown);
      } else {
        front.rect(46, 62, 10, 3, C.green);
        front.rect(73, 62, 10, 3, C.green);
      }
      names = ["Walls & window", "Bookshelves", "Reading furniture"];
      break;
    }
    case "bakery": {
      far.rect(0, 0, 128, 72, C.cream);
      window(far, 8, 17, 28, 31);
      for (let x = 0; x < 128; x += 12)
        far.rect(x, 1, 12, 10, x % 24 ? C.rose : C.white);
      mid.rect(47, 20, 69, 5, C.brown);
      mid.rect(47, 39, 69, 5, C.brown);
      for (let x = 51; x < 116; x += 16) {
        mid.ellipse(x, 14, 11, 6, C.gold);
        mid.line(x + 4, 15, x + 3, 18, C.cream);
        mid.ellipse(x, 33, 12, 6, C.wood);
        mid.ellipse(x + 1, 33, 10, 4, C.sand);
      }
      floor();
      front.rect(39, 52, 80, 17, C.brown);
      front.rect(41, 55, 76, 12, C.wood);
      front.rect(37, 49, 84, 4, C.sand);
      front.rect(73, 44, 11, 5, C.rose);
      front.rect(74, 43, 9, 2, C.cream);
      names = ["Shop walls", "Bread display", "Bakery counter"];
      break;
    }
    case "seaside": {
      sky([C.sky, C.sky, C.cream, C.water]);
      clouds();
      far.rect(0, 40, 128, 32, C.water);
      for (let i = 0; i < 15; i++)
        far.rect((i * 17) % 128, 42 + ((i * 7) % 23), 8, 1, C.sky);
      house(mid, 3, 28, 27, 30, C.pink, C.red);
      house(mid, 34, 22, 29, 36, C.cream, C.blue);
      mid.rect(95, 28, 1, 18, C.brown);
      mid.triangle(84, 29, 11, 13, C.white);
      mid.rect(85, 46, 24, 2, C.brown);
      ground(C.sand, C.cream, 61);
      front.rect(0, 56, 128, 2, C.white);
      for (let x = 0; x < 128; x += 16) front.rect(x, 54, 2, 9, C.white);
      break;
    }
    case "classroom": {
      far.rect(0, 0, 128, 72, C.cream);
      far.rect(0, 48, 128, 8, C.mint);
      for (const x of [5, 26]) window(far, x, 8, 18, 33);
      mid.rect(58, 10, 62, 28, C.wood);
      mid.rect(60, 12, 58, 24, C.moss);
      mid.rect(67, 18, 24, 1, C.cream);
      mid.rect(67, 22, 39, 1, C.cream);
      mid.rect(67, 27, 17, 1, C.cream);
      mid.ellipse(47, 3, 8, 8, C.brown);
      mid.ellipse(48, 4, 6, 6, C.white);
      mid.line(51, 7, 51, 5, C.ink);
      floor();
      for (const y of [45, 61])
        for (const x of [10, 47, 84]) {
          table(front, x, y, 27);
          front.rect(x + 8, y + 6, 10, 3, C.brown);
        }
      names = ["Windows & walls", "Chalkboard", "Classroom desks"];
      break;
    }
    case "rooftop": {
      sky([C.blue, C.sky, C.sky, C.cream]);
      clouds();
      skyline(mid);
      ground(C.steel, C.silver, 55);
      for (let x = 0; x < 128; x += 8) {
        front.rect(x, 30, 1, 26, C.teal);
        front.line(x, 31, x + 20, 54, C.teal);
      }
      front.rect(0, 30, 128, 2, C.teal);
      front.rect(0, 53, 128, 2, C.teal);
      mid.rect(96, 21, 28, 34, C.cream);
      mid.rect(101, 30, 13, 25, C.blue);
      mid.dot(111, 43, C.gold);
      bench(front, 23, 49);
      break;
    }
    case "station": {
      sky([C.sky, C.sky, C.cream, C.steel]);
      skyline(far, C.blue);
      mid.rect(0, 25, 128, 28, C.silver);
      mid.rect(0, 43, 128, 4, C.green);
      for (let x = 7; x < 128; x += 23) {
        mid.rect(x, 28, 17, 12, C.navy);
        mid.rect(x + 1, 29, 14, 4, C.sky);
      }
      mid.rect(47, 27, 17, 25, C.steel);
      mid.rect(54, 27, 1, 25, C.navy);
      ground(C.steel, C.gold, 55);
      front.rect(0, 4, 128, 5, C.navy);
      front.rect(10, 9, 3, 48, C.navy);
      front.rect(116, 9, 3, 48, C.navy);
      front.rect(51, 11, 28, 8, C.green);
      front.rect(56, 14, 18, 1, C.cream);
      front.ellipse(24, 9, 11, 11, C.navy);
      front.ellipse(25, 10, 9, 9, C.cream);
      front.line(29, 14, 29, 11, C.ink);
      front.line(29, 14, 32, 15, C.ink);
      names = ["City beyond", "Commuter train", "Station platform"];
      break;
    }
    case "sakura": {
      sky([C.sky, C.pink, C.cream, C.mint]);
      clouds();
      hills(C.mint, 45);
      mid.rect(0, 49, 128, 13, C.water);
      mid.rect(0, 54, 128, 1, C.sky);
      tree(mid, -12, 2, 2, true);
      tree(mid, 93, 6, 2, true);
      ground(C.sand, C.cream, 62);
      bench(front, 57, 48);
      for (let i = 0; i < 30; i++)
        front.rect(
          (i * 23) % 128,
          25 + ((i * 7) % 44),
          2,
          1,
          i % 2 ? C.rose : C.pink,
        );
      break;
    }
    case "cafe": {
      sky([C.sky, C.cream, C.sand, C.sand]);
      mid.rect(18, 5, 94, 55, C.sand);
      mid.rect(23, 9, 84, 49, C.cream);
      window(mid, 28, 25, 26, 25, C.teal);
      window(mid, 80, 25, 22, 25, C.teal);
      mid.rect(61, 25, 14, 34, C.brown);
      mid.rect(63, 27, 10, 21, C.sky);
      mid.dot(72, 48, C.gold);
      mid.rect(44, 10, 42, 8, C.brown);
      mid.rect(52, 13, 26, 2, C.cream);
      for (let x = 20; x < 112; x += 8) {
        mid.rect(x, 20, 8, 5, x % 16 ? C.rose : C.cream);
        mid.ellipse(x, 23, 8, 5, x % 16 ? C.rose : C.cream);
      }
      ground(C.wood, C.sand, 60);
      table(front, 32, 57, 22);
      front.rect(24, 56, 5, 11, C.brown);
      front.rect(57, 56, 5, 11, C.brown);
      front.rect(37, 54, 4, 3, C.cream);
      front.rect(47, 54, 4, 3, C.cream);
      front.rect(91, 54, 11, 10, C.red);
      tree(front, 84, 27);
      break;
    }
    case "festival": {
      sky([C.ink, C.navy, C.purple, C.dusk]);
      stars();
      for (const [x, y, color] of [
        [27, 14, C.rose],
        [95, 12, C.gold],
      ])
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          far.line(
            x + Math.cos(angle) * 5,
            y + Math.sin(angle) * 5,
            x + Math.cos(angle) * 10,
            y + Math.sin(angle) * 10,
            color,
          );
        }
      for (const [x, color] of [
        [6, C.red],
        [49, C.blue],
        [92, C.rose],
      ]) {
        mid.rect(x, 37, 30, 23, C.wood);
        mid.rect(x + 3, 38, 24, 15, C.navy);
        mid.triangle(x - 2, 27, 34, 12, color);
        mid.rect(x - 2, 37, 34, 3, C.gold);
        mid.rect(x + 6, 45, 5, 6, C.cream);
        mid.rect(x + 18, 45, 5, 6, C.rose);
      }
      ground(C.plum, C.dusk, 61);
      front.line(0, 18, 127, 27, C.ink);
      for (let x = 8; x < 128; x += 17) {
        const y = 20 + Math.floor(x / 15);
        front.rect(x, y, 1, 3, C.ink);
        front.ellipse(x - 3, y + 2, 7, 8, x % 2 ? C.gold : C.rose);
        front.rect(x - 1, y + 3, 2, 5, C.cream);
      }
      break;
    }
    case "boardwalk": {
      sky([C.purple, C.rose, C.peach, C.sand]);
      far.ellipse(52, 22, 24, 24, C.gold);
      mid.rect(0, 44, 128, 28, C.dusk);
      mid.rect(0, 45, 128, 1, C.pink);
      for (let i = 0; i < 20; i++)
        mid.rect(43 + ((i * 13) % 43), 47 + (i % 12), 10, 1, C.peach);
      ground(C.wood, C.sand, 60);
      for (let x = 0; x < 128; x += 10) front.rect(x, 62, 1, 10, C.brown);
      front.rect(0, 49, 128, 2, C.brown);
      for (let x = 1; x < 128; x += 13) front.rect(x, 48, 2, 13, C.brown);
      bench(front, 54, 52);
      lamp(front, 14, 27);
      lamp(front, 106, 27);
      break;
    }
    default:
      throw new Error(`Unknown scene: ${scene.id}`);
  }
  return [far, mid, front].map((art, i) => ({
    name: names[i],
    ratio: [0.1, 0.35, 1][i],
    pixels: resizePixels(art.pixels, 128, 72, width, height),
  }));
}
