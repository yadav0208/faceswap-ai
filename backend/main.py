import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from app.config import settings
from sqlalchemy import update
from app.database import init_db, AsyncSessionLocal
from app.models import Generation
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
    settings.validate_runtime()
    try:
        # Create required directories
        for d in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.POSE_TEMPLATES_DIR]:
            os.makedirs(d, exist_ok=True)
            logger.info(f"Directory ready: {d}")

        # Init DB
        await init_db()
        logger.info("Database initialized")

        # Background jobs cannot survive a backend restart. Ensure the client
        # receives a useful failure instead of polling a stale job forever.
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                update(Generation)
                .where(Generation.status.in_(("pending", "processing")))
                .values(
                    status="failed",
                    error_message="Generation was interrupted by a server restart. Please generate again.",
                )
            )
            await session.commit()
            if result.rowcount:
                logger.info("Recovered %s interrupted generation(s)", result.rowcount)

        # Seed templates
        await seed_templates()
        logger.info("Templates seeded")

        logger.info("Backend ready! Magic Hour configured: %s", magic_hour_provider.configured)
    except Exception as e:
        logger.error("Startup error: %s", e, exc_info=True)
        raise
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Anva AI API",
    description="AI-powered face swap and pose generation",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    openapi_url="/openapi.json" if settings.ENABLE_DOCS else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=None if settings.is_production else r"https://.*\.exp\.direct",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
if settings.trusted_hosts and "*" not in settings.trusted_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(self), microphone=(self), geolocation=()"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Routes
app.include_router(auth.router)
app.include_router(poses.router)
app.include_router(generate.router)


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "provider_configured": magic_hour_provider.configured,
    }
