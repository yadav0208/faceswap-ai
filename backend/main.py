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
from app.ai.magic_hour_provider import magic_hour_provider
from app.routers import auth, poses, generate

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Fun With AI backend...")

    # Create required directories
    for d in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.POSE_TEMPLATES_DIR]:
        os.makedirs(d, exist_ok=True)

    # Init DB
    await init_db()

    # Seed templates
    await seed_templates()

    # Init AI models — skip if USE_AI_MODELS is false (Railway/Magic Hour only mode)
    if settings.USE_AI_MODELS:
        face_detector.initialize()
        image_processor.initialize()
    else:
        logger.info("USE_AI_MODELS=false — skipping local model initialization (Magic Hour mode)")

    logger.info("Backend ready!")
    yield

    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title="Fun With AI API",
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
        "image_provider": settings.IMAGE_PROVIDER,
        "provider_configured": magic_hour_provider.configured,
        "face_swap_provider": settings.FACE_SWAP_PROVIDER,
        "face_swap_configured": magic_hour_provider.configured,
        "device": settings.DEVICE,
    }
