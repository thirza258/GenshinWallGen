import { useMemo, useState } from "react";
import {
  BACKGROUNDS,
  filterAssets,
  GENRES,
  HUMAN_CHARACTERS,
  LIBRARY_ASSETS,
} from "./catalog";
import { createLibraryProject } from "./library";
import { Modal } from "./Dialogs";
import { Thumbnail } from "./PixelCanvas";

const KIND_LABELS = {
  character: "Characters",
  background: "Backgrounds",
  prop: "Props & sprites",
};

function AssetCard({ asset, selected, onSelect }) {
  const preview = useMemo(() => createLibraryProject(asset), [asset]);
  return (
    <button
      className={`ps-asset-card ${selected ? "active" : ""}`}
      aria-pressed={selected}
      aria-label={`Preview ${asset.name}`}
      onClick={onSelect}
    >
      <span className={`ps-asset-art ps-asset-art-${asset.kind}`}>
        <Thumbnail project={preview} />
      </span>
      <strong>{asset.name}</strong>
      <small>
        {asset.genre} ·{" "}
        {asset.species || (asset.kind === "background" ? "Scene" : "Prop")}
      </small>
    </button>
  );
}

function AssetDetail({ asset, project, onUse }) {
  const preview = useMemo(() => createLibraryProject(asset), [asset]);
  const action =
    asset.kind === "character"
      ? "Use character"
      : asset.kind === "background"
        ? "Add scene layers"
        : "Stamp on layer";
  return (
    <aside className="ps-asset-detail" aria-label="Selected asset">
      <div
        className={`ps-asset-art ps-asset-detail-art ps-asset-art-${asset.kind}`}
      >
        <Thumbnail project={preview} />
      </div>
      <div className="ps-section-label">
        {asset.genre.toUpperCase()} ·{" "}
        {asset.species?.toUpperCase() ||
          (asset.kind === "background" ? "SCENE" : "PROP")}
      </div>
      <h3>{asset.name}</h3>
      <p>{asset.description}</p>
      <div className="ps-asset-facts">
        <span>
          {preview.width} × {preview.height} px
        </span>
        <span>
          {asset.kind === "character"
            ? `${preview.rig.length} poseable parts`
            : asset.kind === "background"
              ? "3 parallax layers"
              : "Transparent sprite"}
        </span>
        <span>Editable pixels · Storybook palette</span>
      </div>
      <button className="ps-primary ps-wide" onClick={() => onUse(asset, true)}>
        Open as new project
      </button>
      <button className="ps-wide" onClick={() => onUse(asset, false)}>
        {action}
      </button>
      <p className="ps-small ps-asset-action-note">
        {asset.kind === "character"
          ? "Use character replaces the rig and poses, keeping your artwork."
          : asset.kind === "background"
            ? "Add scene layers places the background behind your artwork in every frame."
            : "Stamp adds the prop at the center of the selected layer in this frame."}{" "}
        Adding uses your current {project.width} × {project.height} canvas and
        palette. Both actions support undo.
      </p>
    </aside>
  );
}

export default function AssetLibrary({ project, onUse, onClose }) {
  const [kind, setKind] = useState(
    project.mode === "background" ? "background" : "character",
  );
  const [genre, setGenre] = useState("all"),
    [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const assets = useMemo(
    () => filterAssets({ kind, genre, query }),
    [kind, genre, query],
  );
  const selected = assets.find((asset) => asset.id === selectedId) || assets[0];
  const changeFilter = (setValue, value) => {
    setValue(value);
    setError("");
  };
  const useAsset = (asset, newProject) => {
    const result = onUse(asset, newProject);
    if (result === true) onClose();
    else setError(result);
  };
  return (
    <Modal
      title="A cast. A setting. Your story."
      onClose={onClose}
      className="ps-library-dialog"
    >
      <p className="ps-muted">
        {HUMAN_CHARACTERS.length} human characters, {BACKGROUNDS.length} worlds,
        and little details to bring them to life.
      </p>
      <div className="ps-library-kinds" role="group" aria-label="Asset type">
        {[["all", "Everything"], ...Object.entries(KIND_LABELS)].map(
          ([value, label]) => (
            <button
              key={value}
              aria-pressed={kind === value}
              className={kind === value ? "active" : ""}
              onClick={() => changeFilter(setKind, value)}
            >
              {label}{" "}
              <span>
                {value === "all"
                  ? LIBRARY_ASSETS.length
                  : LIBRARY_ASSETS.filter((asset) => asset.kind === value)
                      .length}
              </span>
            </button>
          ),
        )}
      </div>
      <div className="ps-library-filters">
        <label>
          Find an asset
          <input
            type="search"
            value={query}
            placeholder="Try mage, café, cherry blossoms…"
            onChange={(e) => changeFilter(setQuery, e.target.value)}
          />
        </label>
        <label>
          Genre
          <select
            value={genre}
            onChange={(e) => changeFilter(setGenre, e.target.value)}
          >
            <option value="all">All genres</option>
            {[...GENRES, "Basics"].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="ps-library-results" role="status">
        {assets.length} {assets.length === 1 ? "asset" : "assets"}
        {genre !== "all" ? ` in ${genre}` : " to explore"}
      </p>
      {error && (
        <p className="ps-error" role="alert">
          {error}
        </p>
      )}
      <div className="ps-library-body">
        {assets.length ? (
          <>
            <div className="ps-asset-grid" aria-label="Library assets">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  selected={asset.id === selected.id}
                  onSelect={() => changeFilter(setSelectedId, asset.id)}
                />
              ))}
            </div>
            <AssetDetail asset={selected} project={project} onUse={useAsset} />
          </>
        ) : (
          <div className="ps-library-empty">
            <h3>No matching assets yet</h3>
            <p>Try a different name, genre, or asset type.</p>
            <button
              onClick={() => {
                setQuery("");
                setGenre("all");
                setKind("all");
                setError("");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      <p className="ps-library-footnote">
        Original studio artwork · Works offline after loading · No account
        needed
      </p>
    </Modal>
  );
}
