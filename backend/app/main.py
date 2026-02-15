from fastapi import FastAPI

from app.routers import analyzeImage, chat

app = FastAPI(
    title="Drone Vision Backend",
    description="FastAPI backend for drone image analysis and VLM chat",
    version="0.1.0",
)

app.include_router(analyzeImage.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"status": "Drone Vision API running", "version": "0.1.0"}

@app.get("/health")
def health():
    return {"status": "ok"}