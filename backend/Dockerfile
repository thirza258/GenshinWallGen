# ./backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy only backend requirements and code
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/

# Create directories that will be used as volumes (they will be overlaid at runtime)
RUN mkdir -p /app/data /app/static /app/source

# Set PYTHONPATH so that backend modules can be imported
ENV PYTHONPATH=/app

# Run migrations and start uvicorn
# Note: working directory is /app, so alembic.ini should be found via backend/alembic.ini
CMD ["sh", "-c", "cd /app/backend && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8009"]