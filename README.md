# GenshinWallCraft

GenshinWallCraft generates task-overlay wallpapers from the artwork in `source/` and lets you use them in two modes:

- Anonymous mode for quick generation and download
- Authenticated mode with saved tasks, history, and private downloads

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
