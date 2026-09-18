import { useRef, useState } from "react";
import {
  blankPixels,
  makeCel,
  makeLayer,
  MAX_PIXELS,
  nearestColor,
  PALETTES,
  paletteText,
  parsePalette,
  swapPalette,
  THEMES,
  TOOLS,
} from "./model";
import { download } from "./export";
import { HUMAN_CHARACTERS, BACKGROUNDS, PROPS } from "./catalog";
import NumberField from "./NumberField";

export function ToolPanel({
  project,
  tool,
  setTool,
  options,
  setOptions,
  part,
}) {
  const tools = [
    ...TOOLS,
    ...(project.mode === "background" && !part
      ? [["terrain", "▧", "Autotile", "A"]]
      : []),
    ...(project.mode === "puppet" && !part
      ? [["pose", "♧", "Pose / FK", "V"]]
      : []),
  ];
  return (
    <section className="ps-panel-section ps-tools-panel">
      <div className="ps-section-label">01 / YOUR TOOLS</div>
      <div className="ps-tool-grid">
        {tools.map(([id, icon, name, key]) => (
          <button
            key={id}
            className={tool === id ? "active" : ""}
            aria-pressed={tool === id}
            title={`${name} (${key})`}
            onClick={() => setTool(id)}
          >
            <span>{icon}</span>
            {name}
            <kbd>{key}</kbd>
          </button>
        ))}
      </div>
      <label className="ps-range-label">
        Brush size <span>{options.size} px</span>
        <input
          aria-label="Brush size"
          type="range"
          min={1}
          max={8}
          value={options.size}
          onChange={(e) =>
            setOptions({ ...options, size: Number(e.target.value) })
          }
        />
      </label>
      {tool === "pattern" && (
        <label>
          Seamless pattern
          <select
            value={options.pattern}
            onChange={(e) =>
              setOptions({ ...options, pattern: e.target.value })
            }
          >
            {["Brick", "Stone", "Leaves"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      )}
      {tool === "terrain" && (
        <label className="ps-check">
          <input
            type="checkbox"
            checked={!!options.eraseTerrain}
            onChange={(e) =>
              setOptions({ ...options, eraseTerrain: e.target.checked })
            }
          />
          Erase terrain
        </label>
      )}
      <div className="ps-section-label ps-spaced">DRAWING AIDS</div>
      <div className="ps-toggle-grid">
        {[
          ["mirrorX", "Mirror ↔"],
          ["mirrorY", "Mirror ↕"],
          ["wrapX", "Wrap X"],
          ["wrapY", "Wrap Y"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={options[id]}
            className={options[id] ? "active" : ""}
            onClick={() => setOptions({ ...options, [id]: !options[id] })}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="ps-small">
        Drag to draw. Choose Eraser to remove pixels, or enable Erase terrain
        with Autotile. Right-click also erases.
      </p>
    </section>
  );
}

export function PalettePanel({
  project,
  update,
  color,
  setColor,
  secondary,
  setSecondary,
  notify,
}) {
  const input = useRef(null),
    [format, setFormat] = useState("hex");
  const [colorTarget, setColorTarget] = useState("primary");
  async function importPalette(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 100_000)
        throw new Error("Palette files must be smaller than 100 KB.");
      const palette = parsePalette(await file.text());
      update((p) => {
        swapPalette(p, palette, file.name, true);
        p.paletteLocked = false;
      });
      setColor(0);
      setSecondary(palette.length > 1 ? 1 : 0);
      notify(
        "Palette imported. Existing colors were matched to the closest new color.",
      );
    } catch (error) {
      notify(error.message, true);
    }
  }
  return (
    <section className="ps-panel-section ps-palette-panel">
      <div className="ps-section-heading">
        <div className="ps-section-label">02 / COLOR PALETTE</div>
        <span className="ps-count">{project.palette.length}</span>
      </div>
      <label className="ps-sr-only" htmlFor="palette-preset">
        Swap palette
      </label>
      <select
        id="palette-preset"
        value={
          Object.hasOwn(PALETTES, project.paletteName)
            ? project.paletteName
            : "custom"
        }
        onChange={(e) => {
          update((p) => {
            swapPalette(p, PALETTES[e.target.value], e.target.value);
            p.paletteLocked = true;
          });
          setColor(0);
          setSecondary(1);
        }}
      >
        {Object.keys(PALETTES).map((name) => (
          <option key={name}>{name}</option>
        ))}
        <option value="custom" disabled>
          Custom palette
        </option>
      </select>
      <div
        className="ps-palette-targets"
        role="group"
        aria-label="Choose which color to set"
      >
        {["primary", "secondary"].map((target) => (
          <button
            key={target}
            aria-pressed={colorTarget === target}
            className={colorTarget === target ? "active" : ""}
            onClick={() => setColorTarget(target)}
          >
            {target === "primary" ? "Primary" : "Secondary"}
          </button>
        ))}
      </div>
      <div className="ps-swatches">
        {project.palette.map((value, i) => (
          <button
            key={i}
            style={{ background: value }}
            className={`${color === i ? "selected" : ""} ${secondary === i ? "secondary" : ""}`}
            title={`${value} · index ${i}. Right-click for secondary color.`}
            aria-label={`Color ${i + 1}: ${value}`}
            aria-pressed={(colorTarget === "primary" ? color : secondary) === i}
            onClick={() =>
              (colorTarget === "primary" ? setColor : setSecondary)(i)
            }
            onContextMenu={(e) => {
              e.preventDefault();
              setSecondary(i);
            }}
          />
        ))}
      </div>
      <div className="ps-color-detail">
        <div style={{ background: project.palette[color] }} />
        <span>
          {project.palette[color]?.toUpperCase()}
          <small>Primary · index {color}</small>
        </span>
        <div
          className="ps-secondary-chip"
          style={{ background: project.palette[secondary] }}
          title="Secondary color for dither and patterns"
        />
      </div>
      <label className="ps-check">
        <input
          type="checkbox"
          checked={project.paletteLocked}
          onChange={(e) =>
            update((p) => {
              p.paletteLocked = e.target.checked;
            })
          }
        />{" "}
        Lock palette colors
      </label>
      {!project.paletteLocked && (
        <label className="ps-color-edit">
          Edit selected color
          <input
            aria-label="Edit selected palette color"
            type="color"
            value={project.palette[color]}
            onChange={(e) =>
              update((p) => {
                p.palette[color] = e.target.value;
                p.paletteName = "Custom";
              })
            }
          />
        </label>
      )}
      <p className="ps-small">
        Choose Primary or Secondary, then a swatch. The secondary color is used
        for dithering and patterns. Palette swaps update every frame and part.
      </p>
      <input
        type="file"
        accept=".hex,.gpl,.pal"
        ref={input}
        hidden
        onChange={importPalette}
      />
      <div className="ps-inline-actions">
        <button onClick={() => input.current.click()}>↑ Import</button>
        <select
          aria-label="Palette export format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          {["hex", "gpl", "pal"].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <button
          onClick={() =>
            download(
              new Blob([paletteText(project.palette, format)], {
                type: "text/plain",
              }),
              `palette.${format}`,
            )
          }
        >
          ↓ Export
        </button>
      </div>
    </section>
  );
}

export function LayerPanel({ project, update, selected, setSelected, notify }) {
  const layer =
    project.layers.find((l) => l.id === selected) || project.layers[0];
  const change = (key, value) =>
    update((p) => {
      p.layers.find((l) => l.id === layer.id)[key] = value;
    });
  const move = (direction) =>
    update((p) => {
      const i = p.layers.findIndex((l) => l.id === layer.id),
        next = i + direction;
      if (next >= 0 && next < p.layers.length)
        [p.layers[i], p.layers[next]] = [p.layers[next], p.layers[i]];
    });
  function add() {
    if (
      project.layers.length >= 16 ||
      project.width *
        project.height *
        (project.layers.length + 1) *
        project.frames.length >
        MAX_PIXELS
    ) {
      notify(
        "Layer limit reached. Use fewer frames or a smaller canvas.",
        true,
      );
      return;
    }
    const layer = makeLayer(`Layer ${project.layers.length + 1}`);
    update((p) => {
      p.layers.push(layer);
      p.frames.forEach((f) => {
        f.cels[layer.id] = makeCel(p.width, p.height);
      });
    });
    setSelected(layer.id);
  }
  return (
    <section className="ps-panel-section">
      <div className="ps-section-heading">
        <h3>Layers</h3>
        <button
          className="ps-icon-button"
          title="Add layer"
          aria-label="Add layer"
          onClick={add}
        >
          ＋
        </button>
      </div>
      <div className="ps-layer-list">
        {[...project.layers].reverse().map((l) => (
          <div
            key={l.id}
            className={`ps-layer ${l.id === layer.id ? "active" : ""}`}
          >
            <button
              className="ps-icon-button"
              aria-label={`${l.visible ? "Hide" : "Show"} ${l.name}`}
              title="Toggle visibility"
              onClick={() =>
                update((p) => {
                  p.layers.find((x) => x.id === l.id).visible = !l.visible;
                })
              }
            >
              {l.visible ? "◉" : "○"}
            </button>
            <button className="ps-layer-name" onClick={() => setSelected(l.id)}>
              {l.clip ? "↳ " : ""}
              {l.name}
              <small>
                {Math.round(l.opacity * 100)}%
                {project.mode === "background" ? ` · scroll ${l.ratio}×` : ""}
              </small>
            </button>
            <button
              className="ps-icon-button"
              aria-label={`${l.locked ? "Unlock" : "Lock"} ${l.name}`}
              title="Toggle edit lock"
              onClick={() =>
                update((p) => {
                  p.layers.find((x) => x.id === l.id).locked = !l.locked;
                })
              }
            >
              {l.locked ? "▪" : "▫"}
            </button>
          </div>
        ))}
      </div>
      <label>
        Layer name
        <input
          value={layer.name}
          maxLength={100}
          onChange={(e) => change("name", e.target.value || "Layer")}
        />
      </label>
      <label className="ps-range-label">
        Opacity <span>{Math.round(layer.opacity * 100)}%</span>
        <input
          aria-label="Layer opacity"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={layer.opacity}
          onChange={(e) => change("opacity", Number(e.target.value))}
        />
      </label>
      <label>
        Blend mode
        <select
          value={layer.blend}
          onChange={(e) => change("blend", e.target.value)}
        >
          {[
            ["source-over", "Normal"],
            ["multiply", "Multiply"],
            ["screen", "Screen"],
            ["overlay", "Overlay"],
            ["lighter", "Add"],
          ].map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="ps-check">
        <input
          type="checkbox"
          checked={layer.clip}
          onChange={(e) => change("clip", e.target.checked)}
        />{" "}
        Clip to layer below
      </label>
      {project.mode === "background" && (
        <label className="ps-range-label">
          Parallax ratio <span>{layer.ratio.toFixed(2)}×</span>
          <input
            aria-label="Parallax ratio"
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={layer.ratio}
            onChange={(e) => change("ratio", Number(e.target.value))}
          />
        </label>
      )}
      <div className="ps-inline-actions">
        <button
          onClick={() => move(1)}
          disabled={project.layers.at(-1).id === layer.id}
          aria-label="Move layer up"
        >
          ↑ Up
        </button>
        <button
          onClick={() => move(-1)}
          disabled={project.layers[0].id === layer.id}
          aria-label="Move layer down"
        >
          ↓ Down
        </button>
        <button
          className="ps-danger"
          disabled={project.layers.length === 1}
          onClick={() =>
            update((p) => {
              p.layers = p.layers.filter((l) => l.id !== layer.id);
              p.frames.forEach((f) => {
                delete f.cels[layer.id];
              });
            })
          }
        >
          Delete
        </button>
      </div>
    </section>
  );
}

export function LibraryPanel({
  project,
  update,
  selectedPart,
  setTool,
  onBrowse,
}) {
  function reskin(style) {
    update((p) => {
      const part = p.rig.find((r) => r.id === selectedPart) || p.rig[0];
      const dark = nearestColor("#1d2b53", p.palette),
        light = nearestColor(
          style === "Armor"
            ? "#c2c3c7"
            : style === "Hair"
              ? "#ab5236"
              : "#ffec27",
          p.palette,
        );
      if (style === "Blade") {
        const scale = Math.max(1, Math.floor(Math.min(p.width, p.height) / 36));
        part.width = 5 * scale;
        part.height = 16 * scale;
        part.pivotX = 2 * scale;
        part.pivotY = 14 * scale;
        part.pixels = blankPixels(part.width, part.height);
        for (let y = 0; y < part.height; y++)
          for (let x = 0; x < part.width; x++) {
            const px = Math.floor(x / scale),
              py = Math.floor(y / scale);
            if (
              (py < 11 && px >= 1 && px <= 3 && (py > 0 || px === 2)) ||
              py === 11 ||
              (py > 11 && px === 2)
            )
              part.pixels[y * part.width + x] =
                py === 11
                  ? light
                  : py < 11
                    ? nearestColor("#c2c3c7", p.palette)
                    : dark;
          }
        part.style = style;
        return;
      }
      for (let y = 0; y < part.height; y++)
        for (let x = 0; x < part.width; x++) {
          if (style === "Hair" && y > part.height / 3) continue;
          part.pixels[y * part.width + x] =
            style === "Blade" && x < part.width / 2 - 1
              ? -1
              : x === 0 ||
                  y === 0 ||
                  x === part.width - 1 ||
                  y === part.height - 1
                ? dark
                : light;
        }
      part.style = style;
    });
  }
  return (
    <section className="ps-panel-section">
      <div className="ps-section-label">MADE FOR YOUR NEXT STORY</div>
      <h3 className="ps-spaced">Characters, worlds & little things</h3>
      <p className="ps-small">
        From a fantasy quest to a first café date. Find a cast and a setting,
        then make every pixel yours.
      </p>
      <div className="ps-library-summary">
        <span>
          <strong>{HUMAN_CHARACTERS.length}</strong> humans
        </span>
        <span>
          <strong>{BACKGROUNDS.length}</strong> scenes
        </span>
        <span>
          <strong>{PROPS.length}</strong> props
        </span>
      </div>
      <button className="ps-primary ps-wide" onClick={onBrowse}>
        Browse library →
      </button>
      <p className="ps-small">Fantasy · Cozy · School life · Romcom</p>
      {project.mode === "puppet" && (
        <>
          <div className="ps-section-label ps-spaced">RESKIN SELECTED PART</div>
          <div className="ps-inline-actions">
            {["Hair", "Armor", "Blade"].map((s) => (
              <button key={s} onClick={() => reskin(s)}>
                {s}
              </button>
            ))}
          </div>
          <p className="ps-small">
            Part edits carry through every pose. Select a part in Rig to
            customize it pixel by pixel.
          </p>
        </>
      )}
      {project.mode === "background" && (
        <>
          <h3 className="ps-spaced">Terrain themes</h3>
          <div className="ps-theme-list">
            {Object.entries(THEMES).map(([name, colors]) => (
              <button
                key={name}
                className={project.theme === name ? "active" : ""}
                aria-pressed={project.theme === name}
                onClick={() => {
                  update((p) => {
                    p.theme = name;
                  });
                  setTool("terrain");
                }}
              >
                <span className="ps-theme-colors">
                  {colors.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </span>
                {name}
              </button>
            ))}
          </div>
          <label>
            Autotile rules
            <select
              value={project.tileRule}
              onChange={(e) =>
                update((p) => {
                  p.tileRule = e.target.value;
                })
              }
            >
              <option value="16">16-tile · Cardinal neighbors</option>
              <option value="47">47-tile · Corners & edges</option>
              <option value="wang">Wang · Edge matching</option>
            </select>
          </label>
          <label>
            Tile size
            <select
              value={project.tileSize}
              onChange={(e) =>
                update((p) => {
                  const old = p.tileSize,
                    next = Number(e.target.value);
                  p.frames.forEach((f) =>
                    Object.values(f.cels).forEach((c) => {
                      const tiles = {};
                      Object.keys(c.tiles).forEach((key) => {
                        const [x, y] = key.split(",").map(Number);
                        for (
                          let py = y * old;
                          py < Math.min((y + 1) * old, p.height);
                          py++
                        )
                          for (
                            let px = x * old;
                            px < Math.min((x + 1) * old, p.width);
                            px++
                          )
                            tiles[
                              `${Math.floor(px / next)},${Math.floor(py / next)}`
                            ] = 1;
                      });
                      c.tiles = tiles;
                    }),
                  );
                  p.tileSize = next;
                })
              }
            >
              {[8, 16, 32].map((s) => (
                <option key={s} value={s}>
                  {s} × {s} px
                </option>
              ))}
            </select>
          </label>
          <button className="ps-wide" onClick={() => setTool("terrain")}>
            Paint terrain →
          </button>
          <p className="ps-small">
            Connected edges update as you paint. Right-click removes a tile.
            Tile occupancy is exported as collision data.
          </p>
        </>
      )}
    </section>
  );
}

export function RigPanel({
  project,
  frame,
  selected,
  setSelected,
  update,
  onEdit,
  setTool,
}) {
  const part = project.rig.find((p) => p.id === selected) || project.rig[0];
  function change(key, value) {
    update((p) => {
      p.rig.find((r) => r.id === part.id)[key] = value;
    });
  }
  const descendants = new Set([part.id]);
  let size;
  do {
    size = descendants.size;
    project.rig.forEach((p) => {
      if (descendants.has(p.parent)) descendants.add(p.id);
    });
  } while (size !== descendants.size);
  const nodes = (parent, depth = 0) =>
    project.rig
      .filter((p) => p.parent === parent)
      .map((p) => (
        <div key={p.id}>
          <button
            className={`ps-bone-row ${p.id === part.id ? "active" : ""}`}
            style={{ paddingLeft: 10 + depth * 12 }}
            onClick={() => {
              setSelected(p.id);
              setTool("pose");
            }}
            onDoubleClick={() => onEdit(p.id)}
          >
            {p.parent ? "└ " : "◇ "}
            {p.name}
          </button>
          {nodes(p.id, depth + 1)}
        </div>
      ));
  return (
    <section className="ps-panel-section">
      <div className="ps-section-heading">
        <h3>Bone hierarchy</h3>
        <span className="ps-count">{project.rig.length}</span>
      </div>
      <div className="ps-bone-tree">{nodes(null)}</div>
      <label>
        Parent
        <select
          value={part.parent || ""}
          onChange={(e) => change("parent", e.target.value || null)}
        >
          <option value="">Canvas root</option>
          {project.rig
            .filter((p) => !descendants.has(p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </label>
      <label className="ps-range-label">
        Rotation{" "}
        <span>{Math.round(project.frames[frame].pose[part.id] || 0)}°</span>
        <input
          aria-label="Part rotation"
          type="range"
          min={-180}
          max={180}
          value={project.frames[frame].pose[part.id] || 0}
          onChange={(e) =>
            update((p) => {
              p.frames[frame].pose[part.id] = Number(e.target.value);
            })
          }
        />
      </label>
      <div className="ps-form-row">
        {[
          ["x", "Position X", -1024, 1024],
          ["y", "Position Y", -1024, 1024],
          ["pivotX", "Pivot X", 0, part.width],
          ["pivotY", "Pivot Y", 0, part.height],
        ].map(([key, label, min, max]) => (
          <label key={key}>
            {label}
            <NumberField
              aria-label={label}
              min={min}
              max={max}
              step={project.pixelSnap ? 1 : 0.5}
              value={part[key]}
              onCommit={(value) => change(key, value)}
            />
          </label>
        ))}
      </div>
      <button className="ps-wide ps-primary" onClick={() => onEdit(part.id)}>
        ✎ Edit part pixels
      </button>
      <p className="ps-small">
        Drag a limb on the canvas to rotate it. Double-click to edit its pixels.
        Pivots and artwork are shared by all keyframes.
      </p>
    </section>
  );
}
