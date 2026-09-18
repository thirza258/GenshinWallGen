import { pixelArt, resizePixels, STORY_COLORS as C } from "./art.js";

export function createHumanRig(character, width, height, palette) {
  const parts = [];
  const skin = character.skin === "brown" ? C.medium : C[character.skin];
  const skinShade = {
    light: C.tan,
    tan: C.medium,
    brown: C.deep,
    deep: C.brown,
  }[character.skin];
  const outfit = C[character.color],
    accent = C[character.accent],
    hair = C[character.hairColor];
  const add = (id, name, parent, x, y, w, h, pivotX, pivotY, draw) => {
    const art = pixelArt(w, h, palette);
    draw(art);
    parts.push({
      id,
      name,
      parent,
      x,
      y,
      width: w,
      height: h,
      pivotX,
      pivotY,
      pixels: art.pixels,
    });
  };
  const block = (art, w, h, fill) => {
    art.rect(1, 0, w - 2, h, C.ink);
    art.rect(0, 1, w, h - 2, C.ink);
    art.rect(1, 1, w - 2, h - 2, fill);
  };
  // Draw order is independent of hierarchy: the cape and legs sit behind the torso.
  if (character.accessory === "cape")
    add("cape", "Cape", "torso", 4, 1, 14, 16, 7, 1, (a) => {
      a.triangle(0, 0, 14, 16, C.ink);
      a.triangle(2, 1, 10, 14, accent);
      a.line(7, 3, 9, 13, outfit);
    });
  for (const [side, x] of [
    ["left", 2],
    ["right", 6],
  ]) {
    add(`${side}-leg`, `${side} leg`, "torso", x, 8, 4, 7, 2, 1, (a) => {
      block(a, 4, 7, character.outfit === "tracksuit" ? outfit : C.navy);
      a.rect(
        1,
        1,
        1,
        4,
        character.outfit === "dress" || character.outfit === "skirt"
          ? skin
          : C.blue,
      );
    });
    add(
      `${side}-foot`,
      `${side} shoe`,
      `${side}-leg`,
      2,
      6,
      5,
      3,
      2,
      1,
      (a) => {
        block(a, 5, 3, character.genre === "Fantasy" ? C.brown : C.cream);
      },
    );
  }
  add("torso", "Outfit", null, 16, 16, 8, 10, 4, 1, (a) => {
    block(a, 8, 10, outfit);
    a.rect(3, 0, 2, 2, skin);
    const style = character.outfit;
    if (["blazer", "suit", "cardigan", "coat"].includes(style)) {
      a.triangle(1, 1, 6, 4, C.cream);
      a.rect(3, 2, 2, 6, style === "cardigan" ? accent : C.cream);
      if (style !== "cardigan") a.line(4, 2, 4, 5, accent);
      a.dot(5, 7, C.gold);
    } else if (style === "armor") {
      a.rect(1, 2, 2, 5, C.silver);
      a.rect(3, 4, 3, 2, accent);
      a.rect(1, 8, 6, 1, C.navy);
    } else if (["apron", "overalls"].includes(style)) {
      a.rect(2, 3, 4, 6, accent);
      a.rect(2, 1, 1, 3, accent);
      a.rect(5, 1, 1, 3, accent);
      a.rect(3, 5, 2, 2, outfit);
    } else if (style === "hoodie") {
      a.rect(1, 1, 6, 2, accent);
      a.rect(3, 2, 2, 2, outfit);
      a.rect(2, 6, 4, 2, C.cream);
    } else if (style === "tracksuit") {
      a.rect(1, 2, 1, 7, accent);
      a.rect(5, 2, 1, 7, accent);
      a.rect(3, 1, 1, 8, C.cream);
    } else {
      a.rect(1, 6, 6, 2, accent);
      a.dot(4, 6, C.gold);
      if (style === "vest") a.rect(3, 1, 2, 5, C.cream);
      if (style === "yukata") a.line(2, 1, 5, 5, C.pink);
    }
  });
  if (["robe", "dress", "skirt", "coat", "yukata"].includes(character.outfit))
    add("hem", "Skirt / coat hem", "torso", 4, 7, 12, 8, 6, 0, (a) => {
      a.triangle(0, -5, 12, 13, C.ink);
      a.triangle(1, -5, 10, 12, character.outfit === "skirt" ? accent : outfit);
      a.line(4, 2, 3, 6, character.outfit === "skirt" ? C.blue : accent);
      a.line(7, 2, 8, 6, character.outfit === "skirt" ? C.blue : accent);
    });
  for (const [side, x] of [
    ["left", 0],
    ["right", 8],
  ]) {
    add(`${side}-arm`, `${side} sleeve`, "torso", x, 2, 4, 6, 2, 1, (a) => {
      block(a, 4, 6, outfit);
      a.rect(1, 4, 2, 1, accent);
    });
    add(
      `${side}-forearm`,
      `${side} forearm`,
      `${side}-arm`,
      2,
      5,
      3,
      4,
      1,
      1,
      (a) => {
        block(a, 3, 4, skin);
        a.dot(1, 2, skinShade);
      },
    );
    add(
      `${side}-hand`,
      `${side} hand`,
      `${side}-forearm`,
      1,
      3,
      3,
      3,
      1,
      1,
      (a) => block(a, 3, 3, skin),
    );
  }
  add("head", "Face", "torso", 4, 0, 12, 12, 6, 10, (a) => {
    a.ellipse(0, 0, 12, 12, C.ink);
    a.ellipse(1, 1, 10, 10, skin);
    a.rect(2, 8, 8, 2, skinShade);
    a.rect(3, 8, 6, 2, skin);
    a.rect(3, 6, 1, 2, C.ink);
    a.rect(8, 6, 1, 2, C.ink);
    a.dot(3, 6, C.white);
    a.dot(8, 6, C.white);
    a.dot(2, 8, C.rose);
    a.dot(9, 8, C.rose);
    a.rect(5, 9, 2, 1, skinShade);
  });
  const long = character.hair === "long",
    pony = character.hair === "ponytail";
  add(
    "hair",
    "Hair",
    "head",
    6,
    1,
    pony ? 17 : 14,
    long ? 18 : 13,
    7,
    2,
    (a) => {
      if (long) {
        a.rect(0, 3, 3, 14, C.ink);
        a.rect(11, 3, 3, 14, C.ink);
        a.rect(1, 4, 2, 12, hair);
        a.rect(11, 4, 2, 12, hair);
      }
      if (pony) {
        a.ellipse(11, 1, 6, 12, C.ink);
        a.ellipse(12, 2, 4, 10, hair);
        a.rect(12, 3, 3, 2, accent);
      }
      a.ellipse(0, 0, 14, 9, C.ink);
      a.ellipse(1, 1, 12, 7, hair);
      a.rect(2, 6, 10, 7, -1);
      a.rect(2, 4, 4, 3, hair);
      a.rect(6, 4, 4, 2, hair);
      a.rect(2, 2, 8, 1, character.hairColor === "black" ? C.navy : C.wood);
      if (character.hair === "bob") {
        a.rect(0, 5, 2, 7, hair);
        a.rect(12, 5, 2, 7, hair);
      }
      if (character.hair === "curly") {
        for (const [x, y] of [
          [0, 2],
          [2, 0],
          [6, 0],
          [10, 1],
          [11, 4],
        ]) {
          a.ellipse(x, y, 4, 4, C.ink);
          a.ellipse(x + 1, y, 2, 3, hair);
        }
      }
    },
  );
  const accessory = character.accessory;
  if (accessory !== "none" && accessory !== "cape")
    add(
      "accessory",
      accessory[0].toUpperCase() + accessory.slice(1),
      "head",
      6,
      0,
      18,
      19,
      9,
      5,
      (a) => {
        if (accessory === "hat") {
          a.triangle(3, 0, 12, 8, C.ink);
          a.triangle(5, 1, 8, 6, outfit);
          a.rect(1, 7, 16, 2, C.ink);
          a.rect(3, 7, 12, 1, accent);
          a.dot(10, 3, C.gold);
        } else if (["cap", "sunhat", "beret"].includes(accessory)) {
          a.ellipse(3, 3, 12, 5, C.ink);
          a.ellipse(
            4,
            3,
            10,
            4,
            accessory === "beret"
              ? C.red
              : accessory === "cap"
                ? C.white
                : C.gold,
          );
          a.rect(
            accessory === "sunhat" ? 0 : 3,
            7,
            accessory === "sunhat" ? 18 : 12,
            1,
            accent,
          );
        } else if (accessory === "crown") {
          a.rect(4, 5, 10, 2, C.gold);
          for (const x of [4, 8, 12]) a.rect(x, 3, 2, 3, C.gold);
          a.dot(8, 5, C.red);
        } else if (accessory === "glasses") {
          a.rect(4, 11, 4, 3, C.ink);
          a.rect(10, 11, 4, 3, C.ink);
          a.rect(5, 12, 2, 1, C.sky);
          a.rect(11, 12, 2, 1, C.sky);
          a.rect(8, 12, 2, 1, C.ink);
        } else if (accessory === "scarf") {
          a.rect(4, 15, 10, 2, accent);
          a.rect(11, 16, 3, 3, accent);
        } else if (accessory === "headband") {
          a.rect(3, 8, 12, 1, accent);
          a.rect(13, 8, 2, 3, accent);
        } else if (accessory === "headphones") {
          a.rect(4, 5, 10, 1, accent);
          a.rect(2, 8, 2, 5, C.ink);
          a.rect(14, 8, 2, 5, C.ink);
          a.rect(2, 9, 1, 3, accent);
          a.rect(15, 9, 1, 3, accent);
        } else if (accessory === "bow") {
          a.rect(12, 7, 2, 3, C.rose);
          a.rect(15, 7, 2, 3, C.rose);
          a.dot(14, 8, C.red);
        } else if (accessory === "flower") {
          a.ellipse(12, 7, 4, 4, C.pink);
          a.dot(14, 9, C.gold);
        }
      },
    );

  const scale =
    Math.min(width, height) < 32
      ? Math.min(width, height) / 32
      : Math.min(13, Math.floor(Math.min(width, height) / 32));
  for (const part of parts) {
    const w = Math.max(1, Math.round(part.width * scale)),
      h = Math.max(1, Math.round(part.height * scale));
    part.pixels = resizePixels(part.pixels, part.width, part.height, w, h);
    part.width = w;
    part.height = h;
    part.pivotX = Math.min(w, Math.round(part.pivotX * scale));
    part.pivotY = Math.min(h, Math.round(part.pivotY * scale));
    part.x = part.parent ? Math.round(part.x * scale) : Math.floor(width / 2);
    part.y = part.parent ? Math.round(part.y * scale) : Math.floor(height / 2);
  }
  return parts;
}
