from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from src.models.schemas import CloudConfig
from src.services.iso_service import ISOManager
import os
from pathlib import Path

app = FastAPI(title="Cloud-Init ISO Generator")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
@app.post("/api/generate")
async def generate_iso(config: CloudConfig):
    try:
        iso_path = ISOManager.create_iso(config)
        return FileResponse(
            path=iso_path,
            filename=os.path.basename(iso_path),
            media_type="application/x-iso9660-image"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Serve Frontend
frontend_path = Path(__file__).parent.parent / "static"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {"message": "Frontend not found. Please build the frontend and place it in the static directory."}

