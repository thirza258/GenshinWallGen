import { useEffect, useRef, useState } from "react";
import { PALETTES, createProject } from "./model";
import { BACKGROUNDS, CHARACTER_GROUPS, GENRES } from "./catalog";

export function Modal({ title, children, onClose, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={`ps-dialog ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ps-dialog-heading">
        <h2>{title}</h2>
        <button
          aria-label="Close dialog"
          onClick={onClose}
          className="ps-icon-button"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function NewProjectDialog({ onCreate, onClose, onDownload }) {
  const [mode, setMode] = useState("sprite"),
    [width, setWidth] = useState(32),
    [height, setHeight] = useState(32);
  const [customSize, setCustomSize] = useState(false);
  const [name, setName] = useState("Untitled sprite"),
    [palette, setPalette] = useState("PICO-8"),
    [archetype, setArchetype] = useState("Village adventurer"),
    [scene, setScene] = useState(""),
    [sample, setSample] = useState(false);
  function chooseMode(next) {
    setMode(next);
    setName(
      next === "background"
        ? "Untitled world"
        : next === "puppet"
          ? "Untitled character"
          : "Untitled sprite",
    );
    setWidth(next === "background" ? 64 : 32);
    setHeight(next === "background" ? 64 : 32);
    setCustomSize(false);
    if (next !== "sprite") setPalette("Storybook");
  }
  return (
    <Modal title="A little canvas. Endless possibilities." onClose={onClose}>
      <p className="ps-muted">
        Choose what you want to make. Every pixel is yours.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCreate(
            createProject({
              name: name.trim() || "Untitled",
              mode,
              width: Number(width),
              height: Number(height),
              palette,
              archetype,
              sample,
              scene,
            }),
          );
        }}
      >
        <div className="ps-mode-cards">
          {[
            ["sprite", "▦", "Pixel sprite", "Draw & animate frame by frame"],
            [
              "puppet",
              "♧",
              "Modular character",
              "Pose, reskin & animate a rig",
            ],
            [
              "background",
              "▧",
              "Background & tiles",
              "Build seamless little worlds",
            ],
          ].map(([id, icon, title, text]) => (
            <button
              type="button"
              key={id}
              className={mode === id ? "active" : ""}
              aria-pressed={mode === id}
              onClick={() => chooseMode(id)}
            >
              <span className="ps-mode-icon">{icon}</span>
              <strong>{title}</strong>
              <small>{text}</small>
            </button>
          ))}
        </div>
        <label>
          Project name
          <input
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <div className="ps-form-row">
          <label>
            Canvas preset
            <select
              aria-label="Canvas preset"
              value={customSize ? "custom" : `${width}x${height}`}
              onChange={(e) => {
                setCustomSize(e.target.value === "custom");
                if (e.target.value !== "custom") {
                  const [w, h] = e.target.value.split("x").map(Number);
                  setWidth(w);
                  setHeight(h);
                }
              }}
            >
              {[16, 32, 64, 128, 256].map((s) => (
                <option key={s} value={`${s}x${s}`}>
                  {s} × {s} px
                </option>
              ))}
              <option value="320x180">320 × 180 · Parallax</option>
              <option value="128x72">128 × 72 · Scene</option>
              <option value="custom">Custom size</option>
            </select>
          </label>
          <label>
            Palette
            <select
              value={palette}
              onChange={(e) => setPalette(e.target.value)}
            >
              {Object.keys(PALETTES).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="ps-form-row">
          <label>
            Width (px)
            <input
              type="number"
              min={1}
              max={512}
              required
              value={width}
              onChange={(e) => {
                setWidth(e.target.value);
                setCustomSize(true);
              }}
            />
          </label>
          <label>
            Height (px)
            <input
              type="number"
              min={1}
              max={512}
              required
              value={height}
              onChange={(e) => {
                setHeight(e.target.value);
                setCustomSize(true);
              }}
            />
          </label>
        </div>
        {mode === "puppet" && (
          <label>
            Character base
            <select
              value={archetype}
              onChange={(e) => setArchetype(e.target.value)}
            >
              {CHARACTER_GROUPS.map((group) => (
                <optgroup key={group.name} label={group.name}>
                  {group.characters.map((character) => (
                    <option key={character.id}>{character.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        )}
        {mode !== "puppet" && (
          <label className="ps-check">
            <input
              type="checkbox"
              checked={sample}
              onChange={(e) => setSample(e.target.checked)}
            />{" "}
            Start with sample artwork
          </label>
        )}
        {mode === "background" && sample && (
          <label>
            Scene artwork
            <select value={scene} onChange={(e) => setScene(e.target.value)}>
              <option value="">Original parallax hills</option>
              {GENRES.map((genre) => (
                <optgroup key={genre} label={genre}>
                  {BACKGROUNDS.filter((entry) => entry.genre === genre).map(
                    (entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name}
                      </option>
                    ),
                  )}
                </optgroup>
              ))}
            </select>
          </label>
        )}
        <div className="ps-dialog-note">
          This starts a new autosaved project on this device.{" "}
          <button type="button" className="ps-text-button" onClick={onDownload}>
            Download your current project
          </button>{" "}
          to keep a copy.
        </div>
        <div className="ps-dialog-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ps-primary">
            Create project →
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ExportDialog({ project, onClose, onExport, busy, error }) {
  const [format, setFormat] = useState("png"),
    [scale, setScale] = useState(1),
    [padding, setPadding] = useState(1),
    [loop, setLoop] = useState(true);
  return (
    <Modal
      title="Send your pixels into the world."
      onClose={busy ? () => {} : onClose}
    >
      <p className="ps-muted">
        Crisp edges, transparent backgrounds, and no JPEG compression.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onExport({ format, scale, padding, loop });
        }}
      >
        <label>
          Export format
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            disabled={busy}
          >
            <option value="png">PNG · Current frame</option>
            <option value="sheet">Sprite sheet · Packed grid + JSON</option>
            <option value="strip">
              Sprite sheet · Horizontal strip + JSON
            </option>
            <option value="gif">Animated GIF + JSON</option>
            <option value="apng">Animated PNG (APNG) + JSON</option>
            <option value="webp">Animated WebP + JSON</option>
            {project.mode === "background" && (
              <>
                <option value="tiles">Extruded canvas tiles + JSON</option>
                <option value="tileset">Extruded autotile atlas + JSON</option>
                <option value="parallax">Parallax PNG layers + JSON</option>
              </>
            )}
            <option value="project">Editable project (.pixel.json)</option>
          </select>
        </label>
        {format !== "project" && (
          <label>
            Pixel scale
            <select
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              disabled={busy}
            >
              {[1, 2, 4, 8].map((n) => (
                <option key={n} value={n}>
                  {n}× · {project.width * n} × {project.height * n} per frame
                </option>
              ))}
            </select>
          </label>
        )}
        {["tileset", "tiles"].includes(format) && (
          <label>
            Extrusion per edge (px)
            <input
              type="number"
              min={1}
              max={8}
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              required
            />
          </label>
        )}
        {["gif", "apng", "webp"].includes(format) && (
          <>
            <label className="ps-check">
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
              />{" "}
              Loop animation
            </label>
            <p className="ps-dialog-note">
              Animation exports need a server connection. GIF uses 1-bit
              transparency; APNG and WebP preserve partial opacity.
            </p>
          </>
        )}
        {!["png", "project"].includes(format) && (
          <p className="ps-dialog-note">
            Downloads as a ZIP with artwork and JSON metadata for your game
            engine.{" "}
            {project.mode === "puppet" &&
              "Character poses are baked using your interpolation and FPS settings."}
          </p>
        )}
        {error && (
          <p className="ps-error" role="alert">
            {error}
          </p>
        )}
        <div className="ps-dialog-actions">
          <button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="ps-primary" disabled={busy}>
            {busy ? "Preparing export…" : "↓ Download export"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
