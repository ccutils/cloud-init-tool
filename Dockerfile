# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend & Final Image
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    xorriso \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/src/ ./src/

# Copy built frontend from Stage 1 to backend's static directory
COPY --from=frontend-builder /frontend/dist/ ./static/

EXPOSE 8000

# Set environment variable to ensure logs are visible
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
