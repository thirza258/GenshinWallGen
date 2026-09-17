import { useCallback, useEffect, useRef, useState } from "react";
import {
  blankPixels,
  boneTransforms,
  clamp,
  clone,
  createProject,
  floodFill,
  frameAt,
  linePoints,
  makeCel,
  MAX_PIXELS,
  mod,
  nearestColor,
  paint,
  TOOLS,
  uid,
  validateProject,
} from "./model";
import { readProject, saveProject } from "./storage";
import { download, exportProject } from "./export";
import { renderFrame } from "./render";
import PixelCanvas, { Thumbnail } from "./PixelCanvas";
import { ExportDialog, Modal, NewProjectDialog } from "./Dialogs";
import NumberField from "./NumberField";
import {
  LayerPanel,
  LibraryPanel,
  PalettePanel,
  RigPanel,
  ToolPanel,
} from "./Panels";
import "./pixel-studio.css";

const initial = () => ({
  past: [],
  present: createProject({ name: "Forest spirit", sample: true }),
  future: [],
});
const chooseZoom = (width, height) =>
  Math.max(
    1,
    Math.min(
      12,
      Math.floor(
        Math.min(440 / width, 400 / height, (window.innerWidth - 56) / width),
      ),
    ),
  );
const totalDuration = (p) => p.frames.reduce((sum, f) => sum + f.duration, 0);

export default function PixelStudio({ backendUrl, onHome, onWallpaper }) {
  const [history, setHistory] = useState(initial),
    [draft, setDraft] = useState(null);
  const project = history.present,
    view = draft || project;
  const [loaded, setLoaded] = useState(false),
    [storageEnabled, setStorageEnabled] = useState(true),
    [saveStatus, setSaveStatus] = useState("Opening studio…");
  const [frameIndex, setFrameIndex] = useState(0),
    [layerId, setLayerId] = useState(""),
    [partId, setPartId] = useState("torso"),
    [editingPart, setEditingPart] = useState(null);
  const [chosenTool, setTool] = useState("pencil"),
    [color, setColor] = useState(11),
    [secondary, setSecondary] = useState(3);
  const [brushOptions, setBrushOptions] = useState({
    size: 1,
    mirrorX: false,
    mirrorY: false,
    pattern: "Brick",
  });
  const options = {
    ...brushOptions,
    wrapX: !!project.wrapX,
    wrapY: !!project.wrapY,
  };
  const [zoom, setZoom] = useState(() => chooseZoom(32, 32)),
    [grid, setGrid] = useState(true),
    [onion, setOnion] = useState(false),
    [tiled, setTiled] = useState(false);
  const [playing, setPlaying] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [parallax, setParallax] = useState(false),
    [previewScale, setPreviewScale] = useState(2);
  const [tab, setTab] = useState("layers"),
    [dialog, setDialog] = useState(null),
    [exportBusy, setExportBusy] = useState(false),
    [exportError, setExportError] = useState("");
  const [notice, setNotice] = useState(null),
    [cursor, setCursor] = useState(null);
  const gesture = useRef(null),
    importInput = useRef(null),
    latest = useRef(null),
    saved = useRef(null);
  const frame = Math.min(frameIndex, project.frames.length - 1),
    layer =
      project.layers.find((l) => l.id === layerId) || project.layers.at(-1);
  const part = view.rig.find((p) => p.id === editingPart),
    selectedPart = view.rig.find((p) => p.id === partId) || view.rig[0];
  const tool =
    (chosenTool === "pose" && (project.mode !== "puppet" || part)) ||
    (chosenTool === "terrain" && project.mode !== "background")
      ? "pencil"
      : chosenTool;
  const activeTab = tab === "rig" && project.mode !== "puppet" ? "layers" : tab;
  const primaryColor = Math.min(color, project.palette.length - 1),
    secondaryColor = Math.min(secondary, project.palette.length - 1);
  const animation = playing
    ? frameAt(view, elapsed)
    : { index: frame, progress: 0 };
  const notify = useCallback(
    (text, error = false) => setNotice({ text, error }),
    [],
  );

  useEffect(() => {
    const title = document.title;
    document.title = "Pixel Studio | GenshinWallCraft";
    return () => {
      document.title = title;
    };
  }, []);

  const commit = useCallback((next) => {
    setHistory((h) => {
      const pixels =
        next.width * next.height * next.layers.length * next.frames.length;
      const limit = Math.max(2, Math.min(30, Math.floor(16_777_216 / pixels)));
      return {
        past: [...h.past, h.present].slice(-limit),
        present: next,
        future: [],
      };
    });
    setSaveStatus("Unsaved changes");
    setPlaying(false);
  }, []);
  const update = useCallback((mutate) => {
    setHistory((h) => {
      const next = clone(h.present);
      mutate(next);
      const limit = Math.max(
        2,
        Math.min(
          30,
          Math.floor(
            16_777_216 /
              (next.width *
                next.height *
                next.layers.length *
                next.frames.length),
          ),
        ),
      );
      return {
        past: [...h.past, h.present].slice(-limit),
        present: next,
        future: [],
      };
    });
    setSaveStatus("Unsaved changes");
    setPlaying(false);
  }, []);
  function setOptions(next) {
    setBrushOptions(next);
    if (next.wrapX !== options.wrapX || next.wrapY !== options.wrapY)
      update((p) => {
        p.wrapX = next.wrapX;
        p.wrapY = next.wrapY;
      });
  }
  const undo = useCallback(() => {
    if (gesture.current) return;
    setHistory((h) =>
      h.past.length
        ? {
            past: h.past.slice(0, -1),
            present: h.past.at(-1),
            future: [h.present, ...h.future],
          }
        : h,
    );
    setPlaying(false);
    setSaveStatus("Unsaved changes");
  }, []);
  const redo = useCallback(() => {
    if (gesture.current) return;
    setHistory((h) =>
      h.future.length
        ? {
            past: [...h.past, h.present],
            present: h.future[0],
            future: h.future.slice(1),
          }
        : h,
    );
    setPlaying(false);
    setSaveStatus("Unsaved changes");
  }, []);

  useEffect(() => {
    let cancelled = false;
    readProject()
      .then((stored) => {
        if (cancelled) return;
        if (stored) {
          const next = validateProject(stored);
          setHistory({ past: [], present: next, future: [] });
          setZoom(chooseZoom(next.width, next.height));
          setTool(next.mode === "puppet" ? "pose" : "pencil");
          setTab(next.mode === "puppet" ? "rig" : "layers");
          saved.current = next;
        }
        setLoaded(true);
        setSaveStatus(stored ? "Saved on this device" : "Ready to create");
      })
      .catch((error) => {
        if (cancelled) return;
        setStorageEnabled(false);
        setLoaded(true);
        setSaveStatus("Download to save");
        notify(
          `Could not restore autosave. ${error.message} Download projects to keep your work.`,
          true,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [notify]);

  useEffect(() => {
    if (!loaded || !storageEnabled) return;
    latest.current = project;
    let cancelled = false;
    const timer = setTimeout(() => {
      setSaveStatus("Saving…");
      saveProject(project)
        .then(() => {
          saved.current = project;
          if (!cancelled) setSaveStatus("Saved on this device");
        })
        .catch(() => {
          if (!cancelled) {
            setSaveStatus("Download to save");
            notify(
              "Autosave could not complete. Download your project to keep your work.",
              true,
            );
          }
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [project, loaded, storageEnabled, notify]);

  useEffect(() => {
    const beforeUnload = (e) => {
      if (latest.current && latest.current !== saved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      if (latest.current && latest.current !== saved.current)
        saveProject(latest.current).catch(() => {});
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(
      () => setNotice(null),
      notice.error ? 10000 : 4500,
    );
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!playing && !parallax) return;
    let request,
      start = performance.now();
    const tick = (now) => {
      setElapsed(now - start);
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playing, parallax]);

  const saveFile = useCallback(async () => {
    const result = await exportProject(
      project,
      { format: "project" },
      backendUrl,
    );
    download(result.blob, result.name);
    notify("Editable project downloaded.");
  }, [project, backendUrl, notify]);
  useEffect(() => {
    const keydown = (e) => {
      if (
        dialog ||
        /input|select|textarea/i.test(e.target.tagName) ||
        e.target.isContentEditable ||
        gesture.current
      )
        return;
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === "s") {
        e.preventDefault();
        saveFile();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
        return;
      }
      const next = TOOLS.find((t) => t[3].toLowerCase() === key)?.[0];
      if (next) setTool(next);
      if (key === "v" && project.mode === "puppet" && !part) setTool("pose");
      if (key === "a" && project.mode === "background") setTool("terrain");
      if (key === "g") setGrid((v) => !v);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [dialog, undo, redo, saveFile, project.mode, part]);

  function reset(next) {
    setHistory({ past: [], present: next, future: [] });
    setDraft(null);
    setFrameIndex(0);
    setLayerId(next.layers.at(-1).id);
    setEditingPart(null);
    setPartId(next.rig[0]?.id || "torso");
    setPlaying(false);
    setParallax(false);
    setElapsed(0);
    setTiled(false);
    setTool(next.mode === "puppet" ? "pose" : "pencil");
    setTab(
      next.mode === "puppet"
        ? "rig"
        : next.mode === "background"
          ? "library"
          : "layers",
    );
    setZoom(chooseZoom(next.width, next.height));
    setColor(Math.min(11, next.palette.length - 1));
    setSecondary(Math.min(3, next.palette.length - 1));
    setDialog(null);
    setBrushOptions((o) => ({ ...o, mirrorX: false, mirrorY: false }));
    setSaveStatus("Unsaved changes");
  }
  async function importFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 40_000_000)
        throw new Error("Project files must be smaller than 40 MB.");
      const next = validateProject(JSON.parse(await file.text()));
      // Keep the current document in undo history when opening another file.
      const previous = project;
      reset(next);
      setHistory({ past: [previous], present: next, future: [] });
      notify("Project opened. Undo returns to your previous project.");
    } catch (error) {
      notify(
        error instanceof SyntaxError
          ? "This file is not valid project JSON."
          : error.message,
        true,
      );
    }
  }
  async function runExport(exportOptions) {
    setExportBusy(true);
    setExportError("");
    try {
      const result = await exportProject(
        project,
        { ...exportOptions, frame },
        backendUrl,
      );
      download(result.blob, result.name);
      setDialog(null);
      notify("Your export is ready. Happy creating!");
    } catch (error) {
      setExportError(error.message);
    } finally {
      setExportBusy(false);
    }
  }

  function point(e) {
    const bounds = e.currentTarget.getBoundingClientRect(),
      w = part?.width || project.width,
      h = part?.height || project.height;
    const repeat = tiled && !part ? 3 : 1;
    return [
      clamp(
        Math.floor(((e.clientX - bounds.left) / bounds.width) * w * repeat) -
          (repeat === 3 ? w : 0),
        -512,
        1024,
      ),
      clamp(
        Math.floor(((e.clientY - bounds.top) / bounds.height) * h * repeat) -
          (repeat === 3 ? h : 0),
        -512,
        1024,
      ),
    ];
  }
  function hitPart([x, y]) {
    const transforms = boneTransforms(project, project.frames[frame].pose);
    return [...project.rig].reverse().find((p) => {
      const t = transforms[p.id],
        c = Math.cos(t.angle),
        s = Math.sin(t.angle);
      const px = Math.floor((x - t.x) * c + (y - t.y) * s + p.pivotX),
        py = Math.floor(-(x - t.x) * s + (y - t.y) * c + p.pivotY);
      return (
        px >= 0 &&
        px < p.width &&
        py >= 0 &&
        py < p.height &&
        p.pixels[py * p.width + px] >= 0
      );
    });
  }
  function drawStroke(g, position) {
    const p = g.working,
      target = editingPart
        ? p.rig.find((r) => r.id === editingPart)
        : p.frames[frame].cels[layer.id];
    const w = part?.width || p.width,
      h = part?.height || p.height;
    const drawOptions = {
      ...options,
      color: g.erase ? -1 : primaryColor,
      secondary: secondaryColor,
      dither: tool === "dither" && !g.erase,
      pattern: tool === "pattern" && !g.erase ? options.pattern : "",
      wrapX: options.wrapX,
      wrapY: options.wrapY,
    };
    if (tool === "terrain" && !part) {
      for (let [x, y] of linePoints(g.last, position)) {
        if (options.wrapX) x = mod(x, w);
        if (options.wrapY) y = mod(y, h);
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const locations = [
          [x, y],
          ...(options.mirrorX ? [[w - 1 - x, y]] : []),
          ...(options.mirrorY ? [[x, h - 1 - y]] : []),
          ...(options.mirrorX && options.mirrorY
            ? [[w - 1 - x, h - 1 - y]]
            : []),
        ];
        locations.forEach(([px, py]) => {
          const key = `${Math.floor(px / p.tileSize)},${Math.floor(py / p.tileSize)}`;
          if (g.erase) delete target.tiles[key];
          else target.tiles[key] = 1;
        });
      }
    } else if (tool === "fill") {
      if (!g.filled) {
        floodFill(
          target.pixels,
          w,
          h,
          options.wrapX ? mod(position[0], w) : position[0],
          options.wrapY ? mod(position[1], h) : position[1],
          drawOptions,
        );
        g.filled = true;
      }
    } else if (tool === "line" || tool === "rectangle") {
      target.pixels = [...g.originalPixels];
      const [x1, y1] = g.start,
        [x2, y2] = position;
      const points =
        tool === "line"
          ? linePoints(g.start, position)
          : [
              ...linePoints([x1, y1], [x2, y1]),
              ...linePoints([x2, y1], [x2, y2]),
              ...linePoints([x2, y2], [x1, y2]),
              ...linePoints([x1, y2], [x1, y1]),
            ];
      paint(target.pixels, w, h, points, drawOptions);
    } else
      paint(target.pixels, w, h, linePoints(g.last, position), {
        ...drawOptions,
        color: tool === "eraser" ? -1 : drawOptions.color,
      });
    g.last = position;
    g.changed = true;
    setDraft({ ...p });
  }
  function onPointerDown(e) {
    if (
      gesture.current ||
      e.button > 2 ||
      e.button === 1 ||
      playing ||
      parallax
    )
      return;
    const position = point(e);
    if (tool === "picker") {
      const w = part?.width || project.width,
        h = part?.height || project.height;
      const x = mod(position[0], w),
        y = mod(position[1], h);
      if (part) {
        const value = part.pixels[y * w + x];
        if (value >= 0) setColor(value);
      } else {
        const data = renderFrame(project, frame)
          .getContext("2d")
          .getImageData(x, y, 1, 1).data;
        if (data[3])
          setColor(
            nearestColor(
              "#" +
                [...data.slice(0, 3)]
                  .map((c) => c.toString(16).padStart(2, "0"))
                  .join(""),
              project.palette,
            ),
          );
      }
      return;
    }
    if (tool !== "pose" && !part && (layer.locked || !layer.visible)) {
      notify("Select a visible, unlocked layer to draw.", true);
      return;
    }
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const working = clone(project),
      g = {
        working,
        start: position,
        last: position,
        erase: e.button === 2,
        changed: false,
        pointerId: e.pointerId,
      };
    if (tool === "pose" && !part) {
      const hit = hitPart(position) || selectedPart;
      if (!hit) return;
      setPartId(hit.id);
      setTab("rig");
      const transform = boneTransforms(project, project.frames[frame].pose)[
        hit.id
      ];
      g.bone = hit.id;
      g.origin = transform;
      g.startAngle = Math.atan2(
        position[1] - transform.y,
        position[0] - transform.x,
      );
      g.rotation = project.frames[frame].pose[hit.id] || 0;
    } else {
      const target = part
        ? working.rig.find((p) => p.id === editingPart)
        : working.frames[frame].cels[layer.id];
      g.originalPixels = [...target.pixels];
      drawStroke(g, position);
    }
    gesture.current = g;
  }
  function onPointerMove(e) {
    const position = point(e);
    setCursor(position);
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    if (g.bone) {
      const angle = Math.atan2(
        position[1] - g.origin.y,
        position[0] - g.origin.x,
      );
      const value = g.rotation + ((angle - g.startAngle) * 180) / Math.PI;
      g.working.frames[frame].pose[g.bone] =
        mod(Math.round(value) + 180, 360) - 180;
      g.changed = true;
      setDraft({ ...g.working });
    } else drawStroke(g, position);
  }
  function onPointerUp(e) {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    gesture.current = null;
    if (g.changed) commit(g.working);
    setDraft(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function cancelStroke() {
    if (gesture.current) {
      gesture.current = null;
      setDraft(null);
    }
  }
  function editPart(id) {
    setEditingPart(id);
    setPartId(id);
    setTool("pencil");
    setPlaying(false);
    setTiled(false);
    setZoom(Math.min(24, chooseZoom(16, 16)));
  }
  function selectTool(next) {
    setPlaying(false);
    setParallax(false);
    setTool(next);
  }
  function addFrame(duplicate = false) {
    if (
      project.frames.length >= 64 ||
      project.width *
        project.height *
        project.layers.length *
        (project.frames.length + 1) >
        MAX_PIXELS
    ) {
      notify(
        "Frame limit reached. Use fewer layers or a smaller canvas.",
        true,
      );
      return;
    }
    update((p) => {
      const next = duplicate
        ? clone(p.frames[frame])
        : {
            duration: Math.round(1000 / p.fps),
            tag: p.frames[frame].tag,
            pose: clone(p.frames[frame].pose),
            cels: Object.fromEntries(
              p.layers.map((l) => [l.id, makeCel(p.width, p.height)]),
            ),
          };
      next.id = uid();
      p.frames.splice(frame + 1, 0, next);
    });
    setFrameIndex(frame + 1);
  }
  function moveFrame(direction) {
    const destination = frame + direction;
    if (destination < 0 || destination >= project.frames.length) return;
    update((p) => {
      [p.frames[frame], p.frames[destination]] = [
        p.frames[destination],
        p.frames[frame],
      ];
    });
    setFrameIndex(destination);
  }
  async function navigate(callback) {
    if (storageEnabled) {
      try {
        await saveProject(project);
        saved.current = project;
      } catch {
        notify("Autosave failed. Download the project before leaving.", true);
        return;
      }
    }
    callback();
  }

  if (!loaded)
    return (
      <div className="ps-loading" role="status">
        Opening your pixel studio…
      </div>
    );
  return (
    <main className="pixel-studio">
      <h1 className="ps-sr-only">Pixel Studio</h1>
      <header className="ps-header">
        <div className="ps-brand">
          <button
            onClick={() => navigate(onHome)}
            className="ps-logo"
            aria-label="GenshinWallCraft home"
          >
            ✦
          </button>
          <div>
            <strong>
              GenshinWall<span>Craft</span>
            </strong>
            <small>A LITTLE SPACE TO CREATE</small>
          </div>
        </div>
        <nav className="ps-app-nav" aria-label="Creative studios">
          <button onClick={() => navigate(onWallpaper)}>
            ▧ <span>Wallpapers</span>
          </button>
          <a href="#pixel-studio" aria-current="page">
            ▦ <span>Pixel Studio</span>
          </a>
        </nav>
        <div className="ps-header-actions">
          <button aria-label="New project" onClick={() => setDialog("new")}>
            ＋ <span>New project</span>
          </button>
          <button
            className="ps-primary"
            onClick={() => {
              setExportError("");
              setDialog("export");
            }}
          >
            ↓ <span>Export</span>
          </button>
        </div>
      </header>
      <div className="ps-project-bar">
        <div className="ps-project-title">
          <span className="ps-project-icon">▦</span>
          <div>
            <input
              aria-label="Project name"
              value={project.name}
              maxLength={100}
              onChange={(e) =>
                update((p) => {
                  p.name = e.target.value || "Untitled";
                })
              }
            />
            <div>
              <span className="ps-save-dot" />
              {saveStatus}
              <span className="ps-project-kind">
                {" "}
                /{" "}
                {project.mode === "puppet"
                  ? "Modular character"
                  : project.mode === "background"
                    ? "Background & tiles"
                    : "Pixel sprite"}
              </span>
            </div>
          </div>
        </div>
        <div className="ps-project-actions">
          <input
            type="file"
            accept=".json,.pixel.json"
            hidden
            ref={importInput}
            onChange={importFile}
          />
          <button onClick={() => importInput.current.click()}>
            ↑ Open project
          </button>
          <button onClick={saveFile}>↓ Save project</button>
          <span className="ps-divider" />
          <button
            aria-label="Undo"
            title="Undo (Ctrl/⌘ Z)"
            onClick={undo}
            disabled={!history.past.length}
          >
            ↶
          </button>
          <button
            aria-label="Redo"
            title="Redo (Ctrl/⌘ Shift Z)"
            onClick={redo}
            disabled={!history.future.length}
          >
            ↷
          </button>
        </div>
      </div>
      <div className="ps-workspace">
        <aside className="ps-left-panel" aria-label="Drawing tools and palette">
          <ToolPanel
            project={project}
            tool={tool}
            setTool={selectTool}
            options={options}
            setOptions={setOptions}
            part={part}
          />
          <PalettePanel
            project={project}
            update={update}
            color={primaryColor}
            setColor={setColor}
            secondary={secondaryColor}
            setSecondary={setSecondary}
            notify={notify}
          />
        </aside>
        <section className="ps-main-panel" aria-label="Canvas workspace">
          <div className="ps-canvas-toolbar">
            <div className="ps-canvas-title">
              <span className="ps-status-dot" />
              {part ? part.name : "Canvas"}{" "}
              <span className="ps-badge">
                {part?.width || project.width} ×{" "}
                {part?.height || project.height}
              </span>
            </div>
            <div className="ps-canvas-controls">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z / 2))}
                aria-label="Zoom out"
              >
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(32, z * 2))}
                aria-label="Zoom in"
              >
                ＋
              </button>
              <button
                onClick={() =>
                  setZoom(
                    chooseZoom(
                      part?.width || project.width,
                      part?.height || project.height,
                    ),
                  )
                }
              >
                Fit
              </button>
              <button
                className={grid ? "active" : ""}
                aria-pressed={grid}
                title="Toggle pixel grid (G)"
                onClick={() => setGrid(!grid)}
              >
                ▦
              </button>
            </div>
          </div>
          {part && (
            <div className="ps-edit-banner">
              <span>
                Editing <strong>{part.name}</strong> · Updates every keyframe
              </span>
              <button
                onClick={() => {
                  setEditingPart(null);
                  setTool("pose");
                  setZoom(chooseZoom(project.width, project.height));
                }}
              >
                ← Back to character
              </button>
            </div>
          )}
          <div className="ps-canvas-stage">
            <div className="ps-stage-label">
              {tiled
                ? "SEAMLESS TILE PREVIEW"
                : part
                  ? "PART EDITOR"
                  : project.mode === "puppet"
                    ? "CHARACTER STAGE"
                    : "MAKE SOMETHING SMALL. MAKE IT YOURS."}
            </div>
            <PixelCanvas
              project={view}
              frame={animation.index}
              progress={animation.progress}
              scroll={parallax ? elapsed / 35 : 0}
              playing={playing || parallax}
              zoom={zoom}
              grid={grid}
              onion={onion}
              wrapX={options.wrapX}
              wrapY={options.wrapY}
              tiled={tiled}
              part={part}
              selectedPart={selectedPart?.id}
              tool={tool}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={cancelStroke}
              onDoubleClick={(e) => {
                if (project.mode === "puppet" && !part) {
                  const hit = hitPart(point(e));
                  if (hit) editPart(hit.id);
                }
              }}
            />
            <div className="ps-stage-footnote">
              <span>
                {playing || parallax
                  ? "Preview playing · pause to edit"
                  : tool === "pose"
                    ? "Drag a limb to rotate · double-click to edit pixels"
                    : "One pixel at a time."}
              </span>
              <span>{cursor ? `${cursor[0]}, ${cursor[1]}` : "x, y"} px</span>
            </div>
          </div>
          <div className="ps-canvas-options">
            <button
              aria-pressed={onion}
              className={onion ? "active" : ""}
              onClick={() => setOnion(!onion)}
            >
              ◉ Onion skin
            </button>
            {project.mode === "background" && (
              <>
                <button
                  aria-pressed={tiled}
                  className={tiled ? "active" : ""}
                  onClick={() => {
                    setTiled(!tiled);
                    setZoom(
                      chooseZoom(
                        project.width * (tiled ? 1 : 3),
                        project.height * (tiled ? 1 : 3),
                      ),
                    );
                  }}
                >
                  ▦ 9-slice preview
                </button>
                <button
                  aria-pressed={parallax}
                  className={parallax ? "active" : ""}
                  onClick={() => {
                    setParallax(!parallax);
                    setPlaying(false);
                  }}
                >
                  ▶ Parallax
                </button>
              </>
            )}
            <button
              className="ps-clear"
              disabled={!part && layer.locked}
              onClick={() => setDialog("clear")}
            >
              Clear {part ? "part" : "cel"}
            </button>
          </div>
          <section className="ps-timeline" aria-label="Animation timeline">
            <div className="ps-timeline-heading">
              <div>
                <span className="ps-section-label">03 / TIMELINE</span>
                <span className="ps-small">
                  {project.frames.length}{" "}
                  {project.mode === "puppet" ? "keyframes" : "frames"} ·{" "}
                  {(totalDuration(project) / 1000).toFixed(2)}s
                </span>
              </div>
              <div className="ps-inline-actions">
                <button
                  aria-label={playing ? "Pause animation" : "Play animation"}
                  className={playing ? "active" : ""}
                  onClick={() => {
                    setPlaying(!playing);
                    setParallax(false);
                    setEditingPart(null);
                  }}
                >
                  {playing ? "Ⅱ Pause" : "▶ Play"}
                </button>
                <select
                  aria-label="Animation FPS"
                  value={project.fps}
                  onChange={(e) =>
                    update((p) => {
                      p.fps = Number(e.target.value);
                      p.frames.forEach((f) => {
                        f.duration = Math.round(1000 / p.fps);
                      });
                    })
                  }
                >
                  {[8, 12, 24].map((fps) => (
                    <option key={fps} value={fps}>
                      {fps} FPS
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ps-frames">
              {project.frames.map((f, i) => (
                <button
                  className={`ps-frame ${animation.index === i ? "active" : ""}`}
                  key={f.id}
                  aria-label={`Select frame ${i + 1}`}
                  aria-pressed={animation.index === i}
                  onClick={() => {
                    setFrameIndex(i);
                    setPlaying(false);
                  }}
                >
                  <span>
                    {String(i + 1).padStart(2, "0")}
                    <small>{f.tag || "untagged"}</small>
                  </span>
                  <Thumbnail project={project} frame={i} />
                  <small>{f.duration} ms</small>
                </button>
              ))}
              <button
                className="ps-add-frame"
                title="Add a blank frame"
                onClick={() => addFrame(false)}
              >
                ＋<small>Add frame</small>
              </button>
            </div>
            <div className="ps-frame-controls">
              <label>
                Duration{" "}
                <NumberField
                  aria-label="Frame duration in milliseconds"
                  key={project.frames[frame].id}
                  min={20}
                  max={10000}
                  value={project.frames[frame].duration}
                  onCommit={(value) =>
                    update((p) => {
                      p.frames[frame].duration = value;
                    })
                  }
                />{" "}
                ms
              </label>
              <label>
                Tag{" "}
                <input
                  aria-label="Frame tag"
                  list="pixel-tags"
                  maxLength={40}
                  value={project.frames[frame].tag}
                  onChange={(e) =>
                    update((p) => {
                      p.frames[frame].tag = e.target.value;
                    })
                  }
                />
                <datalist id="pixel-tags">
                  <option value="idle" />
                  <option value="walk" />
                  <option value="attack" />
                </datalist>
              </label>
              <button onClick={() => addFrame(true)}>Duplicate</button>
              <button
                onClick={() => moveFrame(-1)}
                disabled={frame === 0}
                aria-label="Move frame left"
              >
                ←
              </button>
              <button
                onClick={() => moveFrame(1)}
                disabled={frame === project.frames.length - 1}
                aria-label="Move frame right"
              >
                →
              </button>
              <button
                className="ps-danger"
                disabled={project.frames.length === 1}
                onClick={() => {
                  update((p) => {
                    p.frames.splice(frame, 1);
                  });
                  setFrameIndex(Math.max(0, frame - 1));
                }}
              >
                Delete
              </button>
            </div>
            {project.mode === "puppet" && (
              <div className="ps-animation-options">
                <label>
                  Motion
                  <select
                    aria-label="Motion interpolation"
                    value={project.interpolation}
                    onChange={(e) =>
                      update((p) => {
                        p.interpolation = e.target.value;
                      })
                    }
                  >
                    <option value="stepped">Stepped rotation</option>
                    <option value="smooth">Smooth cutout · 24 FPS</option>
                  </select>
                </label>
                <label className="ps-check">
                  <input
                    type="checkbox"
                    checked={project.pixelSnap}
                    onChange={(e) =>
                      update((p) => {
                        p.pixelSnap = e.target.checked;
                      })
                    }
                  />{" "}
                  Pixel snap
                </label>
              </div>
            )}
          </section>
        </section>
        <aside className="ps-right-panel" aria-label="Project inspector">
          <div
            className="ps-inspector-tabs"
            role="tablist"
            aria-label="Inspector"
          >
            {[
              "layers",
              "library",
              ...(project.mode === "puppet" ? ["rig"] : []),
            ].map((name) => (
              <button
                key={name}
                id={`ps-tab-${name}`}
                role="tab"
                aria-selected={activeTab === name}
                aria-controls="ps-inspector-content"
                className={activeTab === name ? "active" : ""}
                onClick={() => setTab(name)}
              >
                {name === "rig" ? "Rig" : name[0].toUpperCase() + name.slice(1)}
              </button>
            ))}
          </div>
          <div
            id="ps-inspector-content"
            role="tabpanel"
            aria-labelledby={`ps-tab-${activeTab}`}
          >
            {activeTab === "layers" && (
              <LayerPanel
                project={project}
                update={update}
                selected={layer.id}
                setSelected={setLayerId}
                notify={notify}
              />
            )}
            {activeTab === "library" && (
              <LibraryPanel
                project={project}
                frame={frame}
                layer={layer.id}
                update={update}
                selectedPart={selectedPart?.id}
                setSelectedPart={setPartId}
                setTool={selectTool}
                notify={notify}
              />
            )}
            {activeTab === "rig" && project.mode === "puppet" && (
              <RigPanel
                project={project}
                frame={frame}
                selected={selectedPart?.id}
                setSelected={setPartId}
                update={update}
                onEdit={editPart}
                setTool={selectTool}
              />
            )}
          </div>
          <section className="ps-panel-section ps-preview-section">
            <div className="ps-section-heading">
              <h3>Live preview</h3>
              <div className="ps-preview-scales">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    className={previewScale === s ? "active" : ""}
                    onClick={() => setPreviewScale(s)}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
            <div className="ps-live-preview">
              <Thumbnail
                project={view}
                frame={animation.index}
                progress={animation.progress}
                scroll={parallax ? elapsed / 35 : 0}
                scale={previewScale}
              />
            </div>
            <p className="ps-small">
              {project.mode === "background"
                ? "Move each layer at its own pace."
                : "Small details. Big personality."}
            </p>
          </section>
          <div className="ps-tip-card">
            <span>✦</span>
            <strong>A tiny tip</strong>
            <p>
              {project.mode === "puppet"
                ? "Duplicate a keyframe, rotate a limb, then press Play to bring your character to life."
                : project.mode === "background"
                  ? "Turn on Wrap X and Y, then use the 9-slice preview to see how your texture repeats."
                  : "Try Mirror ↔ for a perfectly symmetrical sprite. A little balance goes a long way."}
            </p>
          </div>
        </aside>
      </div>
      <footer className="ps-footer">
        <span>
          <i /> Pixel Studio{" "}
          <span className="ps-muted">/ A GenshinWallCraft workspace</span>
        </span>
        <button onClick={() => setDialog("help")}>⌨ Shortcuts & help</button>
      </footer>
      {notice && (
        <div
          className={`ps-notice ${notice.error ? "error" : ""}`}
          role={notice.error ? "alert" : "status"}
        >
          {notice.text}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
          >
            ×
          </button>
        </div>
      )}
      {dialog === "new" && (
        <NewProjectDialog
          onCreate={reset}
          onClose={() => setDialog(null)}
          onDownload={saveFile}
        />
      )}
      {dialog === "export" && (
        <ExportDialog
          project={project}
          onClose={() => setDialog(null)}
          onExport={runExport}
          busy={exportBusy}
          error={exportError}
        />
      )}
      {dialog === "clear" && (
        <Modal
          title={`Clear this ${part ? "part" : "cel"}?`}
          onClose={() => setDialog(null)}
        >
          <p>
            {part
              ? "This clears the part artwork in every keyframe."
              : "This clears the selected layer in the current frame."}{" "}
            You can undo this change.
          </p>
          <div className="ps-dialog-actions">
            <button onClick={() => setDialog(null)}>Cancel</button>
            <button
              className="ps-primary"
              onClick={() => {
                update((p) => {
                  if (part)
                    p.rig.find((r) => r.id === part.id).pixels = blankPixels(
                      part.width,
                      part.height,
                    );
                  else
                    p.frames[frame].cels[layer.id] = makeCel(p.width, p.height);
                });
                setDialog(null);
              }}
            >
              Clear {part ? "part" : "cel"}
            </button>
          </div>
        </Modal>
      )}
      {dialog === "help" && (
        <Modal title="A few little shortcuts" onClose={() => setDialog(null)}>
          <div className="ps-help-list">
            {[
              ...TOOLS.map((t) => [t[3], t[2]]),
              ["V", "Pose character"],
              ["A", "Autotile terrain"],
              ["G", "Toggle grid"],
              ["Space", "Play / pause"],
              ["Ctrl / ⌘ Z", "Undo"],
              ["Ctrl / ⌘ Shift Z", "Redo"],
              ["Ctrl / ⌘ S", "Download editable project"],
            ].map(([key, text]) => (
              <p key={key}>
                <kbd>{key}</kbd>
                <span>{text}</span>
              </p>
            ))}
          </div>
          <p className="ps-dialog-note">
            Work is autosaved on this browser and device. Download a project
            file to back it up or continue on another device. PNGs, sprite
            sheets, tilesets, and project files export without a server
            connection.
          </p>
        </Modal>
      )}
    </main>
  );
}
