"""
FastAPI Application — Script Intelligence & Risk Analysis System
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

# Load .env for local development (Render injects env vars directly)
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path, override=False)

from .core.database import engine, Base
from .models import db_models

# Create tables in Neon
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Script Intelligence API",
    description="AI-Powered Script Intelligence & Risk Analysis System",
    version="1.0.0",
)

# CORS — allow Vercel frontend
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://scriptops.vercel.app").rstrip("/")
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://scriptops.vercel.app",
    "https://scriptops-1.onrender.com",
]

if FRONTEND_URL not in origins and FRONTEND_URL != "*":
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if FRONTEND_URL == "*" else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
from .api.routes import router as api_router
from .api.auth import router as auth_router
app.include_router(api_router)
app.include_router(auth_router)


@app.get("/")
async def root():
    return {
        "name": "Script Intelligence API",
        "version": "1.0.0",
        "docs": "/docs",
    }

# Serve static files from the 'static' directory if it exists
static_path = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_path):
    app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # If the path is an API path, it should have been caught by the routers above
        # Otherwise, serve index.html for SPA routing
        if full_path.startswith("api/"):
             return {"detail": "Not Found"}
        return FileResponse(os.path.join(static_path, "index.html"))
