from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Fun With AI"
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

    class Config:
        env_file = ".env"


settings = Settings()
