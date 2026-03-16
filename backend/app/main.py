from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.routers import analyzeImage, chat, session
from app.services.database import connect_to_mongo, close_mongo_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    connect_to_mongo()
    yield
    # Shutdown
    close_mongo_connection()


app = FastAPI(
    title="Drone Vision Backend",
    description="FastAPI backend for drone image analysis and VLM chat with MongoDB session management",
    version="0.2.0",
    lifespan=lifespan,
)

app.include_router(analyzeImage.router)
app.include_router(chat.router)
app.include_router(session.router)


@app.get("/")
def root():
    return {"status": "Drone Vision API running", "version": "0.2.0"}


@app.get("/health")
def health():
    return {"status": "ok"}