import {
  boneTransforms,
  interpolatedPose,
  nearestColor,
  THEMES,
  tileMask,
  tileVariants,
  frameAt,
} from "./model";

export function canvas(width, height) {
  const result = document.createElement("canvas");
  result.width = width;
  result.height = height;
  result.getContext("2d").imageSmoothingEnabled = false;
  return result;
}

export function pixelCanvas(pixels, width, height, palette) {
  const result = canvas(width, height),
    ctx = result.getContext("2d");
  const image = ctx.createImageData(width, height);
  const rgb = palette.map((c) =>
    [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)),
  );
  pixels.forEach((color, i) => {
    if (color < 0 || !rgb[color]) return;
    image.data.set([...rgb[color], 255], i * 4);
  });
  ctx.putImageData(image, 0, 0);
  return result;
}

export function drawTile(ctx, x, y, size, mask, theme, palette, rule) {
  const colors = THEMES[theme].map((c) => palette[nearestColor(c, palette)]);
  ctx.fillStyle = theme === "Grassland" ? colors[2] : colors[0];
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = colors[3];
  if (["Dungeon / Cave", "Castle stone", "Festival paving"].includes(theme)) {
    for (let iy = 0; iy < size; iy += 4) {
      ctx.fillRect(x, y + iy, size, 1);
      for (let ix = iy % 8 ? 4 : 0; ix < size; ix += 8)
        ctx.fillRect(x + ix, y + iy, 1, 4);
    }
  } else if (theme === "Cyberpunk") {
    ctx.fillStyle = colors[2];
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.fillStyle = colors[3];
    ctx.fillRect(x + Math.floor(size / 2), y + 2, 1, size - 4);
    ctx.fillRect(x + 2, y + Math.floor(size / 2), size - 4, 1);
  } else if (theme === "Sci-Fi") {
    ctx.fillStyle = colors[2];
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    ctx.fillStyle = colors[3];
    ctx.fillRect(x + 3, y + 3, size - 6, 1);
    ctx.fillRect(x + size - 3, y + size - 3, 1, 1);
  } else if (
    ["Cozy village", "Café interior", "Coastal path"].includes(theme)
  ) {
    ctx.fillStyle = colors[2];
    for (let iy = 3; iy < size; iy += 4) {
      ctx.fillRect(x, y + iy, size, 1);
      ctx.fillRect(x + (iy % 8 ? 2 : Math.floor(size / 2)), y + iy - 3, 1, 3);
    }
  } else if (theme === "School floor") {
    ctx.fillStyle = colors[2];
    ctx.fillRect(x, y + size - 1, size, 1);
    ctx.fillRect(x + size - 1, y, 1, size);
    ctx.fillStyle = colors[3];
    ctx.fillRect(x + 1, y + 1, size - 2, 1);
  } else {
    for (let iy = 2; iy < size; iy += 3)
      for (let ix = 1; ix < size; ix += 4) ctx.fillRect(x + ix, y + iy, 1, 1);
  }
  ctx.fillStyle = colors[1];
  const edge = rule === "wang" ? 1 : 2;
  if (!(mask & 1)) ctx.fillRect(x, y, size, edge);
  if (!(mask & 2)) ctx.fillRect(x + size - edge, y, edge, size);
  if (!(mask & 4)) ctx.fillRect(x, y + size - edge, size, edge);
  if (!(mask & 8)) ctx.fillRect(x, y, edge, size);
  if (rule === "47") {
    if ((mask & 3) === 3 && !(mask & 16))
      ctx.fillRect(x + size - edge, y, edge, edge);
    if ((mask & 6) === 6 && !(mask & 32))
      ctx.fillRect(x + size - edge, y + size - edge, edge, edge);
    if ((mask & 12) === 12 && !(mask & 64))
      ctx.fillRect(x, y + size - edge, edge, edge);
    if ((mask & 9) === 9 && !(mask & 128)) ctx.fillRect(x, y, edge, edge);
  }
  // In Wang mode each cardinal bit is an edge color. Neighboring tiles
  // share the same edge color, including along the repeated atlas edges.
  if (rule === "wang") {
    [
      [1, x, y, size, 1],
      [2, x + size - 1, y, 1, size],
      [4, x, y + size - 1, size, 1],
      [8, x, y, 1, size],
    ].forEach(([bit, tx, ty, tw, th]) => {
      ctx.fillStyle = colors[mask & bit ? 0 : 1];
      ctx.fillRect(tx, ty, tw, th);
    });
    ctx.fillStyle = colors[0];
    [
      [x, y],
      [x + size - 1, y],
      [x, y + size - 1],
      [x + size - 1, y + size - 1],
    ].forEach(([cx, cy]) => ctx.fillRect(cx, cy, 1, 1));
  }
}

export function layerCanvas(project, frameIndex, layer, options = {}) {
  const { width, height, tileSize, tileRule, theme, palette } = project;
  const result = canvas(width, height),
    ctx = result.getContext("2d");
  const cel = project.frames[frameIndex].cels[layer.id];
  for (const key of Object.keys(cel.tiles)) {
    const [x, y] = key.split(",").map(Number);
    const mask = tileMask(
      cel.tiles,
      x,
      y,
      tileRule,
      Math.ceil(width / tileSize),
      Math.ceil(height / tileSize),
      options.wrapX ?? project.wrapX,
      options.wrapY ?? project.wrapY,
    );
    drawTile(
      ctx,
      x * tileSize,
      y * tileSize,
      tileSize,
      mask,
      theme,
      palette,
      tileRule,
    );
  }
  ctx.drawImage(pixelCanvas(cel.pixels, width, height, palette), 0, 0);
  return result;
}

export function rigCanvas(project, pose) {
  const { width, height, rig, palette } = project,
    result = canvas(width, height),
    ctx = result.getContext("2d");
  const transforms = boneTransforms(project, pose),
    pixels = Array(width * height).fill(-1);
  // Inverse sampling at destination pixel centers produces fully opaque,
  // integer pixels even when limbs rotate through non-right angles.
  for (const part of rig) {
    const t = transforms[part.id],
      c = Math.cos(t.angle),
      s = Math.sin(t.angle);
    const corners = [
      [0, 0],
      [part.width, 0],
      [0, part.height],
      [part.width, part.height],
    ].map(([x, y]) => [
      t.x + (x - part.pivotX) * c - (y - part.pivotY) * s,
      t.y + (x - part.pivotX) * s + (y - part.pivotY) * c,
    ]);
    const left = Math.max(0, Math.floor(Math.min(...corners.map((v) => v[0])))),
      right = Math.min(width, Math.ceil(Math.max(...corners.map((v) => v[0]))));
    const top = Math.max(0, Math.floor(Math.min(...corners.map((v) => v[1])))),
      bottom = Math.min(
        height,
        Math.ceil(Math.max(...corners.map((v) => v[1]))),
      );
    for (let y = top; y < bottom; y++)
      for (let x = left; x < right; x++) {
        const px = Math.floor(
          (x + 0.5 - t.x) * c + (y + 0.5 - t.y) * s + part.pivotX,
        );
        const py = Math.floor(
          -(x + 0.5 - t.x) * s + (y + 0.5 - t.y) * c + part.pivotY,
        );
        if (
          px >= 0 &&
          py >= 0 &&
          px < part.width &&
          py < part.height &&
          part.pixels[py * part.width + px] >= 0
        )
          pixels[y * width + x] = part.pixels[py * part.width + px];
      }
  }
  ctx.drawImage(pixelCanvas(pixels, width, height, palette), 0, 0);
  return result;
}

export function renderFrame(project, index = 0, options = {}) {
  const result = canvas(project.width, project.height),
    ctx = result.getContext("2d");
  let previous = null;
  for (const layer of project.layers) {
    if (!layer.visible) {
      previous = null;
      continue;
    }
    const content = layerCanvas(project, index, layer, options),
      lc = content.getContext("2d");
    if (layer.clip) {
      if (!previous) lc.clearRect(0, 0, content.width, content.height);
      else {
        lc.globalCompositeOperation = "destination-in";
        lc.drawImage(previous, 0, 0);
        lc.globalCompositeOperation = "source-over";
      }
    }
    const offset =
      Math.round((options.scroll || 0) * layer.ratio) % project.width;
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blend;
    ctx.drawImage(content, -offset, 0);
    if (offset) ctx.drawImage(content, project.width - offset, 0);
    previous = canvas(project.width, project.height);
    previous.getContext("2d").globalAlpha = layer.opacity;
    previous.getContext("2d").drawImage(content, 0, 0);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  if (project.mode === "puppet")
    ctx.drawImage(
      rigCanvas(project, interpolatedPose(project, index, options.progress)),
      0,
      0,
    );
  return result;
}

export function bakeFrames(project) {
  if (project.mode !== "puppet" || project.frames.length === 1)
    return project.frames.map((frame, i) => ({
      canvas: renderFrame(project, i),
      duration: frame.duration,
      tag: frame.tag,
      source: i,
      pose: frame.pose,
    }));
  const fps = project.interpolation === "smooth" ? 24 : project.fps;
  const total = project.frames.reduce((n, f) => n + f.duration, 0);
  const count = Math.ceil((total * fps) / 1000);
  if (count > 240)
    throw new Error(
      "This animation bakes to more than 240 frames. Shorten the frame durations before exporting.",
    );
  return Array.from({ length: count }, (_, i) => {
    const time = (i * 1000) / fps,
      { index, progress } = frameAt(project, time);
    return {
      canvas: renderFrame(project, index, { progress }),
      duration:
        Math.min(total, Math.round(((i + 1) * 1000) / fps)) - Math.round(time),
      tag: project.frames[index].tag,
      source: index,
      pose: interpolatedPose(project, index, progress),
    };
  });
}

export function scaledCanvas(source, scale) {
  const result = canvas(source.width * scale, source.height * scale);
  result.getContext("2d").drawImage(source, 0, 0, result.width, result.height);
  return result;
}

function extrudeTile(ctx, tile, x, y, size, padding) {
  ctx.drawImage(tile, x, y);
  if (!padding) return;
  ctx.drawImage(tile, 0, 0, size, 1, x, y - padding, size, padding);
  ctx.drawImage(tile, 0, size - 1, size, 1, x, y + size, size, padding);
  ctx.drawImage(tile, 0, 0, 1, size, x - padding, y, padding, size);
  ctx.drawImage(tile, size - 1, 0, 1, size, x + size, y, padding, size);
  for (const sx of [0, size - 1])
    for (const sy of [0, size - 1]) {
      ctx.drawImage(
        tile,
        sx,
        sy,
        1,
        1,
        x + (sx ? size : -padding),
        y + (sy ? size : -padding),
        padding,
        padding,
      );
    }
}

export function extrudedCanvasTiles(project, frame, padding = 1, scale = 1) {
  const size = project.tileSize,
    columns = Math.ceil(project.width / size),
    rows = Math.ceil(project.height / size),
    stride = size + padding * 2;
  if (columns * rows * stride * stride * scale * scale > 32_000_000)
    throw new Error(
      "This tile sheet is too large. Reduce the padding or scale.",
    );
  const source = renderFrame(project, frame),
    output = canvas(columns * stride, rows * stride),
    ctx = output.getContext("2d"),
    tile = canvas(size, size),
    tc = tile.getContext("2d");
  const tiles = Array.from({ length: columns * rows }, (_, i) => {
    const column = i % columns,
      row = Math.floor(i / columns),
      x = column * stride + padding,
      y = row * stride + padding;
    tc.clearRect(0, 0, size, size);
    tc.drawImage(source, -column * size, -row * size);
    extrudeTile(ctx, tile, x, y, size, padding);
    return {
      id: i,
      column,
      row,
      x: x * scale,
      y: y * scale,
      width: size * scale,
      height: size * scale,
    };
  });
  return {
    canvas: scaledCanvas(output, scale),
    tiles,
    padding: padding * scale,
  };
}

export function tilesetCanvas(project, padding = 1, scale = 1) {
  const masks = tileVariants(project.tileRule),
    columns = Math.ceil(Math.sqrt(masks.length)),
    size = project.tileSize;
  const stride = size + padding * 2,
    output = canvas(
      columns * stride,
      Math.ceil(masks.length / columns) * stride,
    ),
    ctx = output.getContext("2d");
  const tiles = masks.map((mask, i) => {
    const tile = canvas(size, size);
    drawTile(
      tile.getContext("2d"),
      0,
      0,
      size,
      mask,
      project.theme,
      project.palette,
      project.tileRule,
    );
    const x = (i % columns) * stride + padding,
      y = Math.floor(i / columns) * stride + padding;
    // Replicate border texels into the gutter to prevent texture bleeding.
    extrudeTile(ctx, tile, x, y, size, padding);
    return {
      id: i,
      mask,
      x: x * scale,
      y: y * scale,
      width: size * scale,
      height: size * scale,
    };
  });
  return {
    canvas: scaledCanvas(output, scale),
    tiles,
    padding: padding * scale,
  };
}
