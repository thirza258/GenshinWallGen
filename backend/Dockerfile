# ./backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system fonts
RUN apt-get update && apt-get install -y \
    fonts-dejavu-core \
    fonts-liberation \
 && rm -rf /var/lib/apt/lists/*

# Copy only backend requirements and code
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/

# Create directories that will be used as volumes
RUN mkdir -p /app/data /app/static /app/source

# Set PYTHONPATH so that backend modules can be imported
ENV PYTHONPATH=/app

# Run migrations and start uvicorn
CMD ["sh", "-c", "cd /app/backend && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8009"]