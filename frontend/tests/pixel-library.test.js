import test from "node:test";
import assert from "node:assert/strict";
import {
  BACKGROUNDS,
  filterAssets,
  GENRES,
  HUMAN_CHARACTERS,
  LIBRARY_ASSETS,
  PROPS,
} from "../src/pixel/catalog.js";
import {
  applyLibraryAsset,
  createLibraryProject,
} from "../src/pixel/library.js";
import {
  boneTransforms,
  clone,
  createProject,
  makeCel,
  makeLayer,
  uid,
  validateProject,
} from "../src/pixel/model.js";

test("the library covers human casts and complete scenes in every story genre", () => {
  assert.equal(
    new Set(LIBRARY_ASSETS.map((entry) => entry.id)).size,
    LIBRARY_ASSETS.length,
  );
  for (const genre of GENRES) {
    assert.ok(
      HUMAN_CHARACTERS.filter(
        (entry) => entry.genre === genre && entry.species === "Human",
      ).length >= 6,
    );
    assert.ok(BACKGROUNDS.filter((entry) => entry.genre === genre).length >= 4);
  }
  assert.equal(
    filterAssets({ query: "  HUMAN fantasy  " }).filter(
      (entry) => entry.genre !== "Fantasy",
    ).length,
    0,
  );
  assert.ok(
    filterAssets({
      query: "cherry blossoms",
      kind: "background",
      genre: "Romcom",
    }).some((entry) => entry.id === "sakura-promenade"),
  );
  assert.equal(filterAssets({ query: "castle", kind: "prop" }).length, 0);
  assert.ok(
    filterAssets({ query: "cafe" }).some((entry) => entry.id === "corner-cafe"),
  );
});

test("every asset opens, serializes and validates with full and limited palettes", () => {
  for (const asset of LIBRARY_ASSETS) {
    for (const palette of ["Storybook", "PICO-8", "GameBoy"]) {
      const project = createLibraryProject(asset, palette);
      assert.deepEqual(
        validateProject(JSON.parse(JSON.stringify(project))),
        project,
        `${asset.id} / ${palette}`,
      );
      assert.ok(
        project.rig.some((part) => part.pixels.some((c) => c >= 0)) ||
          Object.values(project.frames[0].cels).some((cel) =>
            cel.pixels.some((c) => c >= 0),
          ),
        asset.id,
      );
    }
  }
});

test("human artwork is distinct and its editable parts follow the rig hierarchy", () => {
  const signatures = new Set();
  for (const asset of HUMAN_CHARACTERS) {
    const project = createLibraryProject(asset);
    signatures.add(JSON.stringify(project.rig.map((part) => part.pixels)));
    const idle = boneTransforms(project, {}),
      posed = boneTransforms(project, { head: 35, "left-arm": 40 });
    assert.notDeepEqual(posed.hair, idle.hair, asset.id);
    assert.notDeepEqual(posed["left-hand"], idle["left-hand"], asset.id);
    assert.deepEqual(posed["right-hand"], idle["right-hand"], asset.id);
    for (const size of [1, 16, 64, 512])
      assert.doesNotThrow(
        () =>
          validateProject(
            createProject({
              mode: "puppet",
              archetype: asset.id,
              width: size,
              height: size,
              palette: "Storybook",
            }),
          ),
        `${asset.id} at ${size}px`,
      );
  }
  assert.equal(signatures.size, HUMAN_CHARACTERS.length);
});

test("backgrounds have distinct populated planes and independent project copies", () => {
  const signatures = new Set();
  for (const asset of BACKGROUNDS) {
    const project = createLibraryProject(asset),
      second = createLibraryProject(asset);
    assert.equal(project.layers.length, 3);
    assert.deepEqual(
      project.layers.map((l) => l.ratio),
      [0.1, 0.35, 1],
    );
    const cels = Object.values(project.frames[0].cels);
    assert.ok(
      cels[0].pixels.every((color) => color >= 0),
      asset.id,
    );
    for (const cel of cels.slice(1)) {
      assert.ok(
        cel.pixels.some((color) => color >= 0),
        asset.id,
      );
      assert.ok(cel.pixels.includes(-1), asset.id);
    }
    signatures.add(JSON.stringify(cels));
    cels[0].pixels[0] = -1;
    assert.notEqual(Object.values(second.frames[0].cels)[0].pixels[0], -1);
  }
  assert.equal(signatures.size, BACKGROUNDS.length);
});

test("using a human preserves artwork and frame timing while replacing the old rig and poses", () => {
  const project = createProject({ mode: "puppet" });
  project.frames[0].pose.head = 30;
  project.frames[0].duration = 250;
  project.frames[0].cels[project.layers[0].id].pixels[0] = 5;
  const before = clone(project);
  applyLibraryAsset(project, HUMAN_CHARACTERS[2]);
  assert.equal(project.mode, "puppet");
  assert.deepEqual(project.layers, before.layers);
  assert.deepEqual(project.frames[0].cels, before.frames[0].cels);
  assert.deepEqual(project.frames[0].pose, {});
  assert.equal(project.frames[0].duration, 250);
  assert.ok(project.rig.some((part) => part.name === "Hat"));
  validateProject(project);
});

test("scene insertion retains characters, tiles and art and fills each animation frame independently", () => {
  const project = createProject({ mode: "puppet", palette: "GameBoy" });
  const original = project.layers[0].id;
  project.frames[0].cels[original].pixels[0] = 3;
  project.frames[0].cels[original].tiles["0,0"] = 1;
  project.frames[0].pose.head = 20;
  project.frames.push({ ...clone(project.frames[0]), id: uid() });
  const before = clone(project);
  const selected = applyLibraryAsset(project, BACKGROUNDS[12]);
  assert.equal(project.mode, "puppet");
  assert.equal(project.layers.length, 4);
  assert.equal(project.layers.at(-1).id, original);
  assert.equal(selected, project.layers[2].id);
  assert.equal(project.theme, before.theme);
  assert.deepEqual(project.rig, before.rig);
  assert.deepEqual(project.frames[0].pose, before.frames[0].pose);
  assert.deepEqual(
    project.frames[0].cels[original],
    before.frames[0].cels[original],
  );
  const sky = project.layers[0].id;
  project.frames[0].cels[sky].pixels[0] = -1;
  assert.notEqual(project.frames[1].cels[sky].pixels[0], -1);
  validateProject(project);
});

test("scene insertion refuses layer and pixel budgets before changing a project", () => {
  for (const size of [32, 512]) {
    const project = createProject({ width: size, height: size });
    if (size === 32) {
      while (project.layers.length < 14) {
        const layer = makeLayer("Existing");
        project.layers.push(layer);
        project.frames[0].cels[layer.id] = makeCel(size, size);
      }
    } else {
      while (project.frames.length < 9)
        project.frames.push({ ...clone(project.frames[0]), id: uid() });
    }
    const before = clone(project);
    assert.throws(
      () => applyLibraryAsset(project, BACKGROUNDS[0]),
      /three free layers/,
    );
    assert.deepEqual(project, before);
  }
});

test("props stamp opaque pixels only, respect locks and affect just the selected frame", () => {
  const asset = PROPS.find((entry) => entry.id === "love-letter");
  const project = createProject({ sample: true });
  const layer = project.layers[0];
  project.frames[0].cels[layer.id].pixels[0] = 5;
  const otherFrame = clone(project.frames[1]);
  applyLibraryAsset(project, asset);
  assert.equal(project.frames[0].cels[layer.id].pixels[0], 5);
  assert.deepEqual(project.frames[1], otherFrame);
  validateProject(project);
  layer.locked = true;
  const before = clone(project);
  assert.throws(() => applyLibraryAsset(project, asset), /unlocked layer/);
  assert.deepEqual(project, before);
});
