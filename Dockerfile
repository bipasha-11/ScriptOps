# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Accept build-time API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend Final Image
FROM python:3.11-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend as a package named 'backend'
COPY backend/ ./backend/

# Copy necessary assets from root
COPY technicians_dataset_v2.csv ./

# Copy built frontend into backend/static so FastAPI can serve it
COPY --from=frontend-builder /app/frontend/dist ./backend/static

# Create data directory for user persistence
RUN mkdir -p backend/data

EXPOSE 8000

# Run as 'backend.main' so relative imports work correctly
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
