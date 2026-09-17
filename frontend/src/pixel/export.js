import { tileMask } from "./model";
import {
  bakeFrames,
  canvas,
  extrudedCanvasTiles,
  layerCanvas,
  renderFrame,
  scaledCanvas,
  tilesetCanvas,
} from "./render";

export const fileName = (name) =>
  name
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "pixel-art";
export function download(blob, name) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export function pngBlob(image) {
  return new Promise((resolve, reject) =>
    image.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(
              new Error(
                "The image could not be encoded. Try a smaller export.",
              ),
            ),
      "image/png",
    ),
  );
}

// Small, uncompressed ZIP writer. Keeping PNGs uncompressed avoids a second
// compression pass and lets related artwork and metadata download as one file.
export async function zipFiles(files) {
  const encode = new TextEncoder(),
    chunks = [],
    directory = [];
  let offset = 0;
  const crc = (bytes) => {
    let value = 0xffffffff;
    for (const byte of bytes) {
      value ^= byte;
      for (let bit = 0; bit < 8; bit++)
        value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
    }
    return (value ^ 0xffffffff) >>> 0;
  };
  for (const [name, blob] of Object.entries(files)) {
    const bytes = new Uint8Array(await blob.arrayBuffer()),
      filename = encode.encode(name),
      checksum = crc(bytes);
    const header = new Uint8Array(30 + filename.length),
      view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x800, true);
    view.setUint32(14, checksum, true);
    view.setUint32(18, bytes.length, true);
    view.setUint32(22, bytes.length, true);
    view.setUint16(26, filename.length, true);
    header.set(filename, 30);
    const entry = new Uint8Array(46 + filename.length),
      ev = new DataView(entry.buffer);
    ev.setUint32(0, 0x02014b50, true);
    ev.setUint16(4, 20, true);
    ev.setUint16(6, 20, true);
    ev.setUint16(8, 0x800, true);
    ev.setUint32(16, checksum, true);
    ev.setUint32(20, bytes.length, true);
    ev.setUint32(24, bytes.length, true);
    ev.setUint16(28, filename.length, true);
    ev.setUint32(42, offset, true);
    entry.set(filename, 46);
    chunks.push(header, bytes);
    directory.push(entry);
    offset += header.length + bytes.length;
  }
  const end = new Uint8Array(22),
    ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, directory.length, true);
  ev.setUint16(10, directory.length, true);
  ev.setUint32(
    12,
    directory.reduce((n, d) => n + d.length, 0),
    true,
  );
  ev.setUint32(16, offset, true);
  return new Blob([...chunks, ...directory, end], { type: "application/zip" });
}

function metadata(project, scale) {
  const columns = Math.ceil(project.width / project.tileSize),
    rows = Math.ceil(project.height / project.tileSize);
  return {
    app: "Pixel Studio",
    version: 1,
    name: project.name,
    mode: project.mode,
    sourceSize: { width: project.width, height: project.height },
    scale,
    coordinateSystem: "top-left, pixels, clockwise degrees",
    palette: project.palette,
    interpolation: project.interpolation,
    fps: project.fps,
    pixelSnap: project.pixelSnap,
    bones: project.rig.map((part) => {
      const bone = { ...part };
      delete bone.pixels;
      return {
        ...bone,
        x: bone.x * scale,
        y: bone.y * scale,
        pivotX: bone.pivotX * scale,
        pivotY: bone.pivotY * scale,
        width: bone.width * scale,
        height: bone.height * scale,
      };
    }),
    layers: project.layers.map((l) => ({ ...l, parallax: l.ratio })),
    tilemap: {
      tileSize: project.tileSize * scale,
      columns,
      rows,
      rule: project.tileRule,
      theme: project.theme,
      wrapX: project.wrapX,
      wrapY: project.wrapY,
      frames: project.frames.map((f) => ({
        layers: project.layers.map((l) => ({
          id: l.id,
          cells: Array.from({ length: rows }, (_, y) =>
            Array.from({ length: columns }, (_, x) => ({
              collision: !!f.cels[l.id].tiles[`${x},${y}`],
              mask: f.cels[l.id].tiles[`${x},${y}`]
                ? tileMask(
                    f.cels[l.id].tiles,
                    x,
                    y,
                    project.tileRule,
                    columns,
                    rows,
                    project.wrapX,
                    project.wrapY,
                  )
                : null,
            })),
          ),
        })),
      })),
    },
  };
}
const json = (value) =>
  new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });

export async function exportProject(project, options, backendUrl) {
  const { format, scale = 1, padding = 1, loop = true, frame = 0 } = options,
    name = fileName(project.name);
  if (format === "project")
    return { blob: json(project), name: `${name}.pixel.json` };
  if (format === "png")
    return {
      blob: await pngBlob(scaledCanvas(renderFrame(project, frame), scale)),
      name: `${name}.png`,
    };
  const meta = metadata(project, scale),
    files = {};
  if (format === "tileset" || format === "tiles") {
    const result =
      format === "tiles"
        ? extrudedCanvasTiles(project, frame, padding, scale)
        : tilesetCanvas(project, padding, scale);
    meta.tiles = result.tiles;
    meta.padding = result.padding;
    meta.source = format === "tiles" ? "canvas" : "autotile-atlas";
    meta.sourceFrame = frame;
    files[`${name}.png`] = await pngBlob(result.canvas);
  } else if (format === "parallax") {
    for (const [i, layer] of project.layers.entries()) {
      const filename = `${i}-${fileName(layer.name)}.png`;
      files[filename] = await pngBlob(
        scaledCanvas(layerCanvas(project, frame, layer), scale),
      );
      meta.layers[i].image = filename;
    }
  } else {
    const frames = bakeFrames(project);
    if (
      frames.length * project.width * project.height * scale * scale >
      32_000_000
    )
      throw new Error(
        "This export is too large. Reduce the scale or number of frames.",
      );
    meta.frames = frames.map((f, i) => ({
      index: i,
      duration: f.duration,
      tag: f.tag,
      sourceFrame: f.source,
      pose: f.pose,
      bounds: {
        x: 0,
        y: 0,
        width: project.width * scale,
        height: project.height * scale,
      },
    }));
    meta.frameTags = [];
    frames.forEach((f, i) => {
      const last = meta.frameTags.at(-1);
      if (last && last.name === f.tag) last.to = i;
      else meta.frameTags.push({ name: f.tag, from: i, to: i });
    });
    if (["gif", "apng", "webp"].includes(format)) {
      const controller = new AbortController(),
        timeout = setTimeout(() => controller.abort(), 120_000);
      let response;
      try {
        response = await fetch(`${backendUrl}/pixel/export`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            format,
            scale,
            loop,
            frames: frames.map((f) => ({
              png: f.canvas.toDataURL("image/png").split(",")[1],
              duration: f.duration,
            })),
          }),
        });
      } catch (error) {
        throw new Error(
          error.name === "AbortError"
            ? "Animation export timed out. Try a smaller scale."
            : "Animation export could not reach the server. Your project is safe; PNG and sprite sheets work offline.",
          { cause: error },
        );
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          typeof error.detail === "string"
            ? error.detail
            : "Animation export failed. Try fewer frames or a smaller scale.",
        );
      }
      const extension = format === "apng" ? "apng" : format;
      files[`${name}.${extension}`] = await response.blob();
      meta.loop = loop;
    } else {
      const columns =
        format === "strip"
          ? frames.length
          : Math.ceil(Math.sqrt(frames.length));
      const w = project.width * scale,
        h = project.height * scale;
      const sheet = canvas(columns * w, Math.ceil(frames.length / columns) * h),
        ctx = sheet.getContext("2d");
      if (sheet.width > 16384 || sheet.height > 16384)
        throw new Error(
          "The sprite sheet is too wide. Choose a packed grid or reduce the scale.",
        );
      frames.forEach((f, i) => {
        const x = (i % columns) * w,
          y = Math.floor(i / columns) * h;
        ctx.drawImage(f.canvas, x, y, w, h);
        meta.frames[i].bounds = { x, y, width: w, height: h };
      });
      files[`${name}.png`] = await pngBlob(sheet);
    }
  }
  files[`${name}.json`] = json(meta);
  return { blob: await zipFiles(files), name: `${name}-${format}.zip` };
}
