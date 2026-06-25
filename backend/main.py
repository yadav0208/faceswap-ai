import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import init_db
from app.seed import seed_templates
from app.ai.image_processor import image_processor
from app.ai.face_detector import face_detector
from app.routers import auth, poses, generate

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting FaceSwap AI backend...")

    # Create required directories
    for d in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.POSE_TEMPLATES_DIR]:
        os.makedirs(d, exist_ok=True)

    # Init DB
    await init_db()

    # Seed templates
    await seed_templates()

    # Init AI models (non-blocking for CPU mode)
    face_detector.initialize()
    if settings.USE_AI_MODELS:
        image_processor.initialize()

    logger.info("Backend ready!")
    yield

    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title="FaceSwap AI API",
    description="AI-powered face swap and pose generation",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router)
app.include_router(poses.router)
app.include_router(generate.router)


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "ai_enabled": settings.USE_AI_MODELS,
        "device": settings.DEVICE,
    }
