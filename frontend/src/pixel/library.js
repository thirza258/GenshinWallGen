import { backgroundLayers } from "./backgrounds.js";
import {
  createProject,
  createRig,
  makeCel,
  makeLayer,
  MAX_PIXELS,
  spritePixels,
} from "./model.js";

export function createLibraryProject(asset, palette = "Storybook") {
  if (asset.kind === "character")
    return createProject({
      name: asset.name,
      mode: "puppet",
      archetype: asset.name,
      palette,
    });
  if (asset.kind === "background")
    return createProject({
      name: asset.name,
      mode: "background",
      width: 128,
      height: 72,
      palette,
      sample: true,
      scene: asset.id,
    });
  const project = createProject({ name: asset.name, palette });
  project.frames[0].cels[project.layers[0].id].pixels = spritePixels(
    32,
    32,
    project.palette,
    asset.name,
  );
  return project;
}

// Mutate an editor draft only. The caller commits it as one undoable action.
export function applyLibraryAsset(
  project,
  asset,
  { frame = 0, layer = project.layers.at(-1).id } = {},
) {
  if (asset.kind === "character") {
    project.rig = createRig(
      asset.name,
      project.width,
      project.height,
      project.palette,
    );
    project.mode = "puppet";
    project.frames.forEach((f) => {
      f.pose = {};
    });
    return layer;
  }
  if (asset.kind === "background") {
    if (
      project.layers.length + 3 > 16 ||
      project.width *
        project.height *
        (project.layers.length + 3) *
        project.frames.length >
        MAX_PIXELS
    )
      throw new Error(
        "This scene needs three free layers within the project size limit. Open it as a new project or remove unused layers first.",
      );
    const artwork = backgroundLayers(
      asset,
      project.width,
      project.height,
      project.palette,
    );
    const layers = artwork.map((plane) =>
      makeLayer(`${asset.name} · ${plane.name}`, plane.ratio),
    );
    const hasTerrain = project.frames.some((f) =>
      Object.values(f.cels).some((cel) => Object.keys(cel.tiles).length),
    );
    if (!hasTerrain) project.theme = asset.theme;
    project.layers.unshift(...layers);
    project.frames.forEach((f) => {
      layers.forEach((entry, i) => {
        f.cels[entry.id] = {
          ...makeCel(project.width, project.height),
          pixels: [...artwork[i].pixels],
        };
      });
    });
    if (project.mode === "sprite") project.mode = "background";
    return layers.at(-1).id;
  }
  const target = project.layers.find((entry) => entry.id === layer);
  if (!target || target.locked)
    throw new Error("Choose an unlocked layer before stamping a prop.");
  const pixels = spritePixels(
    project.width,
    project.height,
    project.palette,
    asset.name,
  );
  const cel = project.frames[frame].cels[layer];
  pixels.forEach((color, i) => {
    if (color >= 0) cel.pixels[i] = color;
  });
  return layer;
}
