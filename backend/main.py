import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.seed import seed_templates
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
    logger.info("Starting Anva AI backend...")
    try:
        # Create required directories
        for d in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.POSE_TEMPLATES_DIR]:
            os.makedirs(d, exist_ok=True)
            logger.info(f"Directory ready: {d}")

        # Init DB
        await init_db()
        logger.info("Database initialized")

        # Seed templates
        await seed_templates()
        logger.info("Templates seeded")

        logger.info("Backend ready! Magic Hour configured: %s", magic_hour_provider.configured)
    except Exception as e:
        logger.error("Startup error: %s", e, exc_info=True)
    yield
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
