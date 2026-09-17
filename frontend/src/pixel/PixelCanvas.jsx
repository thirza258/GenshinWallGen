import { useEffect, useRef } from "react";
import { boneTransforms } from "./model";
import { pixelCanvas, renderFrame } from "./render";

export function Thumbnail({
  project,
  frame = 0,
  scale,
  className = "",
  progress = 0,
  scroll = 0,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const target = ref.current,
      ctx = target.getContext("2d");
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(renderFrame(project, frame, { progress, scroll }), 0, 0);
  }, [project, frame, progress, scroll]);
  return (
    <canvas
      ref={ref}
      className={`ps-thumbnail ${className}`}
      width={project.width}
      height={project.height}
      style={
        scale
          ? { width: project.width * scale, height: project.height * scale }
          : undefined
      }
      aria-label={`Preview of frame ${frame + 1}`}
    />
  );
}

export default function PixelCanvas({
  project,
  frame,
  progress,
  scroll,
  playing,
  zoom,
  grid,
  onion,
  wrapX,
  wrapY,
  tiled,
  part,
  selectedPart,
  tool,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onDoubleClick,
}) {
  const ref = useRef(null);
  const width = part?.width || project.width,
    height = part?.height || project.height;
  const copies = tiled && !part ? 3 : 1;
  useEffect(() => {
    const target = ref.current,
      ctx = target.getContext("2d");
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.imageSmoothingEnabled = false;
    const draw = (source) => {
      for (let y = 0; y < copies; y++)
        for (let x = 0; x < copies; x++)
          ctx.drawImage(source, x * width, y * height);
    };
    if (onion && !playing && !part && project.frames.length > 1) {
      ctx.globalAlpha = 0.2;
      draw(
        renderFrame(
          project,
          (frame + project.frames.length - 1) % project.frames.length,
          { wrapX, wrapY },
        ),
      );
      ctx.globalAlpha = 0.12;
      draw(
        renderFrame(project, (frame + 1) % project.frames.length, {
          wrapX,
          wrapY,
        }),
      );
      ctx.globalAlpha = 1;
    }
    draw(
      part
        ? pixelCanvas(part.pixels, width, height, project.palette)
        : renderFrame(project, frame, { progress, scroll, wrapX, wrapY }),
    );
  }, [
    project,
    frame,
    progress,
    scroll,
    playing,
    onion,
    part,
    width,
    height,
    copies,
    wrapX,
    wrapY,
  ]);
  const selected = project.rig.find((p) => p.id === selectedPart);
  const transforms =
    !part && !playing && project.mode === "puppet"
      ? boneTransforms(project, project.frames[frame].pose)
      : null;
  const active = transforms?.[selectedPart];
  return (
    <div className="ps-canvas-scroll">
      <div className="ps-canvas-centering">
        <div
          className={`ps-canvas-wrap ${tool === "pose" ? "is-posing" : ""}`}
          style={{
            width: width * zoom * copies,
            height: height * zoom * copies,
            "--pixel-size": `${zoom}px`,
          }}
        >
          <canvas
            ref={ref}
            id="pixel-canvas"
            width={width * copies}
            height={height * copies}
            aria-label={
              part ? `Edit pixels of ${part.name}` : "Pixel art drawing canvas"
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onLostPointerCapture={onPointerCancel}
            onDoubleClick={onDoubleClick}
            onContextMenu={(e) => e.preventDefault()}
          />
          {grid && zoom >= 4 && <div className="ps-grid-overlay" />}
          {tiled && !part && (
            <div
              className="ps-tile-outline"
              style={{
                left: width * zoom,
                top: height * zoom,
                width: width * zoom,
                height: height * zoom,
              }}
            />
          )}
          {transforms && tool === "pose" && (
            <svg
              className="ps-bones"
              viewBox={`0 0 ${project.width} ${project.height}`}
              aria-hidden="true"
            >
              {project.rig.map((p) => {
                const t = transforms[p.id],
                  parent = transforms[p.parent];
                return (
                  <g key={p.id}>
                    {parent && (
                      <line x1={t.x} y1={t.y} x2={parent.x} y2={parent.y} />
                    )}
                    <circle
                      cx={t.x}
                      cy={t.y}
                      r={p.id === selectedPart ? 0.7 : 0.4}
                    />
                  </g>
                );
              })}
              {active && selected && (
                <g className="ps-active-bone">
                  <circle
                    cx={active.x}
                    cy={active.y}
                    r={Math.max(selected.width, selected.height) * 0.8}
                  />
                  <line
                    x1={active.x}
                    y1={active.y}
                    x2={active.x + Math.cos(active.angle) * 8}
                    y2={active.y + Math.sin(active.angle) * 8}
                  />
                </g>
              )}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
