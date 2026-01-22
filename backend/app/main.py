from fastapi import FastAPI

from app.routers import analyzeImage

app = FastAPI(
    title="Drone Vision Backend",
    description="FastAPI backend for drone image analysis and VLM chat",
    version="0.1.0",
)

@app.get("/")
def root():
    return {"status": "Drone Vision API running", "version": "0.1.0"}

@app.get("/health")
def health():
    return {"status": "ok"}