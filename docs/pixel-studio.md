# Pixel Studio

Pixel Studio implements the three creation workflows in the Pixel Studio PRD as a separate, lazy-loaded `/#pixel-studio` page. The wallpaper generator is still available at `/#generator`, with navigation between the workspaces and browser back/forward support.

## Creating artwork

**Pixel sprites:** start with a blank canvas or a sample. Draw with a pencil, erase, fill connected regions, pick colors, draw lines and rectangle outlines, or paint dithered and repeating patterns. Sprout, crystal, and heart starting points are available in Library. Right-click the canvas to erase and right-click a palette swatch to select a secondary color. The secondary color is used for dithering and patterns.

**Modular characters:** choose a humanoid male/female, knight, goblin, or quadruped base. Every base has a parent/child hierarchy with shared pixel artwork. Select bones in Rig or click a limb with the Pose tool. Drag to rotate, change parent or attachment position, and edit its pivot. The selected bone's children follow its rotation. Double-click a limb or choose Edit part pixels to draw locally; the part changes in every frame. The part library provides hair, armor, and a blade replacement.

Duplicate a keyframe, adjust a pose, and set the time to the next pose using Duration. Stepped rotation interpolates poses at discrete 8/12/24 FPS samples; Smooth cutout samples at 24 FPS for baking and updates continuously in preview. Pixel snap rounds bone anchors to integer pixels. All exported poses are rasterized at the project's native pixel resolution without edge smoothing.

**Backgrounds and tiles:** start with a blank canvas or the three-layer parallax example. Grassland, Dungeon/Cave, Cyberpunk, and Sci-Fi use distinct procedural terrain patterns. Select Autotile to paint terrain; its neighbors update automatically. The tile rules offer 16 cardinal variants, 47 normalized blob variants with inner corners, or 16 binary Wang edge combinations. Changing the tile size resamples existing occupancy. Right-click removes terrain. Collision data represents occupied terrain cells, separately for each layer and frame.

Enable Wrap X/Y to paint through opposite edges and connect terrain across them. The 9-slice view repeats the canvas in a 3 × 3 arrangement to inspect seams. The pattern brushes create repeatable brick, stone, or foliage textures; choose dimensions divisible by a pattern's period when an exact repeat is needed. Parallax preview moves visible layers horizontally using their individual scroll ratios; editing pauses while the preview runs.

## Color, layers, and animation

- Indexed palettes: PICO-8, GameBoy, and a 54-color NES RGB approximation. Palette swaps preserve color indices across all cels and parts, wrapping indices when the destination palette is shorter. Importing a palette matches existing colors to their nearest new color. Unlock the palette to edit a color across the whole project.
- Palette formats: line-oriented six-digit `.hex`, GIMP `.gpl`, and text JASC `.pal`. Binary PAL variants are not supported.
- Layers: visibility, edit lock, ordering, opacity, normal/multiply/screen/overlay/add blending, and clipping to the alpha of the immediately lower visible layer. Puppet parts composite above artwork layers.
- Timeline: blank or duplicate frames, reordering, deletion, frame durations in milliseconds, free-form tags including idle/walk/attack, previous/next onion skins, and 1×/2×/4× live previews. Selecting FPS resets frame durations to its interval; durations can then be adjusted individually.
- Canvas sizes: 16, 32, 64, 128, 256 square presets, 320 × 180 parallax, and custom dimensions from 1 to 512 pixels per axis. Canvas magnification uses nearest-neighbor scaling, with an independently scaled vector bone overlay.
- Undo/redo tracks completed strokes and project changes. History is bounded by project size and kept in memory for the current session.

## Saving and exporting

Autosave stores the current project in IndexedDB after an edit. It is scoped to the browser and origin, with no account or server upload. A `.pixel.json` download includes every palette, frame, layer, part, pivot, pose, and tile cell. Open project validates dimensions, color indices, frame references, and bone cycles before loading. Storage failures are surfaced with a download-to-save message.

| Export | Contents |
| --- | --- |
| PNG | Current composited frame with transparency |
| Packed sprite sheet | Square-ish grid of full frame cells plus JSON |
| Horizontal strip | One row of full frame cells plus JSON |
| GIF | Animated indexed image with 1-bit transparency plus JSON |
| APNG | Animated PNG with alpha and per-frame timing plus JSON |
| WebP | Lossless animated WebP with alpha plus JSON |
| Extruded autotile atlas | All variants of the selected terrain rule, with replicated edge texels in 1–8 px gutters, plus tile bounds and collision metadata |
| Extruded canvas tiles | The current composited artwork divided into tiles with replicated edge texels and per-tile bounds |
| Parallax stack | One raw PNG per layer in the current frame, plus visibility, blend, opacity, clipping, and scroll-ratio metadata |
| Editable project | A portable `.pixel.json` project file |

Raster exports support 1×/2×/4×/8× integer scaling. Sprite sheet packing uses equally sized frame cells to retain consistent pivots; it does not trim transparent margins. Multi-file exports are downloaded as a ZIP so browsers do not block separate metadata downloads. GIF's format rounds timing to centiseconds. APNG and WebP preserve millisecond timing and partial alpha. Looping can be disabled.

The JSON describes frame bounds/tags/durations, bone parents and attachment positions, local pivots, poses, indexed palettes, tile collision grids and neighbor masks, and layer scroll ratios. Coordinates use a top-left origin, pixels, and clockwise degrees. Bounds and bone positions in exported metadata include the requested scale. Engine-specific import scripts can consume this schema in Godot or Unity; the JSON is not a native Spine project or a preinstalled engine importer.

## Practical limits

Projects support up to 64 editable frames, 16 artwork layers, 32 bones, and 256 palette colors, within an aggregate budget of 8,388,608 stored cel pixels. Imported project files are capped at 40 MB. Pose baking supports up to 240 output frames. Animation export is capped at 8 million source pixels and 32 million scaled pixels in total, with an 8 MB base64 payload limit. Reduce frame count, duration, or scale if an export exceeds the limit.

PNG, project, sprite sheet, tileset, and parallax exports are local operations once the app has loaded. Animation encoding needs the FastAPI backend and Pillow's codec support; errors leave the project intact. PNG/APNG and GIF are always available with the pinned Pillow dependency. WebP returns a clear error if the hosting build lacks animated WebP support.

## Implementation and checks

- `frontend/src/pixel/model.js`: indexed pixels, brushes, palette conversion, hierarchy transforms, project validation, and tile rules.
- `render.js`: compositing, crisp inverse-sampled rig rasterization, pose baking, tiles and extrusion.
- `PixelStudio.jsx`, `PixelCanvas.jsx`, `Panels.jsx`, `Dialogs.jsx`: editor, pointer gestures, timeline and accessible dialogs.
- `storage.js`: IndexedDB autosave; `export.js`: PNGs, sheets, metadata, ZIP packaging and animation requests.
- `backend/app/api/pixel.py`: bounded, anonymous GIF/APNG/WebP encoding in FastAPI's worker thread pool.
- `frontend/tests/pixel-model.test.js`: drawing, topology, palette, hierarchy, timing and project validation checks.
- `backend/tests/test_pixel_export.py`: real codec decoding, transparency, scaling, frame disposal, loop semantics and invalid input checks.

Pillow animation encoding follows its [official image format documentation](https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html). The NES palette is an RGB approximation because [the NES PPU generates colors as video signals](https://www.nesdev.org/wiki/PPU_palettes).
