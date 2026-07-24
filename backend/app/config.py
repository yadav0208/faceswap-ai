from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Anva AI"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    DATABASE_URL: str = "sqlite+aiosqlite:///./faceswap.db"
    UPLOAD_DIR: str = "uploads"
    OUTPUT_DIR: str = "outputs"
    POSE_TEMPLATES_DIR: str = "pose_templates"

    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_ORIGINS: str = "*"

    # API key — required on every request via X-API-Key header
    API_KEY: str = "change-this-api-key"

    # AES-256 encryption key — 64 hex chars (32 bytes)
    ENCRYPTION_KEY: str = "0" * 64

    USE_AI_MODELS: bool = True
    HF_TOKEN: Optional[str] = None
    DEVICE: str = "cpu"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_TEXT_MODEL: str = "gemini-2.5-flash"
    GEMINI_IMAGE_MODEL: str = "gemini-2.5-flash-image"
    IMAGE_PROVIDER: str = "magic_hour"
    HF_PROVIDER: str = "auto"
    HF_IMAGE_MODEL: str = "black-forest-labs/FLUX.1-schnell"
    HF_IMAGE_STEPS: int = 4
    FACE_SWAP_PROVIDER: str = "magic_hour"
    MAGIC_HOUR_API_KEY: Optional[str] = None
    MAGIC_HOUR_IMAGE_MODEL: str = "flux-schnell"
    AI_REQUEST_TIMEOUT_SECONDS: int = 120
    IMAGE_MODEL_ID: str = "runwayml/stable-diffusion-v1-5"
    IMAGE_WIDTH: int = 512
    IMAGE_HEIGHT: int = 768
    IMAGE_STEPS: int = 28

    class Config:
        env_file = ".env"


settings = Settings()
