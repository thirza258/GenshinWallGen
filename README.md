# GenshinWallCraft

GenshinWallCraft generates task-overlay wallpapers from the artwork in `source/` and lets you use them in two modes:

- Anonymous mode for quick generation and download
- Authenticated mode with saved tasks, history, and private downloads

It also includes **Pixel Studio**, a separate workspace for drawing pixel art, animating modular characters, and building backgrounds and seamless tilesets. Open **Create Pixel Art** on the home page, **Pixel Studio** in the wallpaper editor, or go directly to `/#pixel-studio`. Pixel projects work without an account.

The stack is designed to run with Docker Compose only. No manual database setup and no separate MinIO install are required.

## What Runs In Compose

- `frontend` - React app served by Nginx on `http://localhost:5155`
- `backend` - FastAPI app on `http://localhost:8009`
- `minio` - local object storage on `http://localhost:9000` with console on `http://localhost:9001`

Generated wallpapers and app data are stored in Docker volumes, so they survive container restarts.

## Self Deploy

### Prerequisites

- Docker
- Docker Compose

### Start the stack

```bash
docker compose up -d --build
```

The first run can take a few minutes because Docker needs to build both images and install Python and Node dependencies.

### Open the app

- Main UI: `http://localhost:5155`
- MinIO console: `http://localhost:9001`

MinIO uses these default credentials in the compose file:

- Username: `wallcraft`
- Password: `wallcraft123`

### Stop the stack

```bash
docker compose down
```

## How To Use

1. Open the web UI in your browser.
2. Add daily and weekly tasks.
3. Choose a background image and resolution.
4. Click generate.
5. Download the wallpaper or sign in to keep your tasks and image history on the backend.

Anonymous users can generate and download without registering. Authenticated users can register, log in, save task state, and download the latest stored wallpaper.

### Pixel Studio

1. Open Pixel Studio and edit the example sprite, or choose **New project** for a pixel sprite, modular character, or background/tileset.
2. Draw with pencil, eraser, fill, line, rectangle, dither, and pattern brushes. Use symmetry, wraparound, layers, and indexed palettes to shape your artwork.
3. Add or duplicate frames, set durations and tags, and preview the animation. For characters, select a bone to rotate it or double-click a part to edit its shared pixels. For backgrounds, paint connected terrain and preview each layer's parallax ratio.
4. Choose **Export** for PNG, a sprite sheet, GIF/APNG/WebP, an extruded autotile atlas, or a parallax layer stack. Multi-file exports include JSON metadata in one ZIP.

Your current pixel project is autosaved in this browser's IndexedDB. **Save project** downloads an editable `.pixel.json` backup; **Open project** restores it on any device. Starting a new project replaces the browser's current autosave, so download a copy first. Pixel projects are stored on your device and are independent of wallpaper account storage.

Drawing, project files, PNGs, sprite sheets, palettes, and tileset exports run in the browser. Animated GIF, APNG, and lossless WebP exports use the backend's anonymous `/api/pixel/export` endpoint. See [Pixel Studio's feature and export guide](docs/pixel-studio.md) for details and limits.

### Development checks

```bash
cd frontend
npm ci
npm test
npm run lint
npm run build
```

The pixel engine tests use Node's built-in test runner. To test animated exports, install `backend/requirements-dev.txt` in your Python environment, then run from the repository root:

```bash
python -m unittest discover -s backend/tests -v
```

These backend tests exercise the actual pixel export router without starting the wallpaper scheduler, database, or MinIO.

## Environment Notes

The compose file already wires the local services together. You normally do not need to edit anything for a self-hosted run.

Useful values to know:

- Backend uses SQLite at `backend/wallcraft.db` inside the container
- MinIO stores wallpapers in the `wallpapers` bucket
- Backend can still read optional WhatsApp settings from `backend/.env`

If you want to customize storage, credentials, or the WhatsApp scheduler later, edit `docker-compose.yml` and the backend environment values there.

## Project Layout

```text
.
├── backend/
├── frontend/
├── source/
├── docker-compose.yml
└── README.md
```

## Notes

- The frontend talks to the backend through the `/api` path in the Nginx config.
- The backend creates the MinIO bucket on demand.
- The daily WhatsApp job is optional and only matters if you configure the WhatsApp environment variables.
