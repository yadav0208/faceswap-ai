from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "FaceSwap AI"
    SECRET_KEY: str = "dev-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    DATABASE_URL: str = "sqlite+aiosqlite:///./faceswap.db"
    UPLOAD_DIR: str = "uploads"
    OUTPUT_DIR: str = "outputs"
    POSE_TEMPLATES_DIR: str = "pose_templates"

    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_ORIGINS: str = "*"

    USE_AI_MODELS: bool = False
    HF_TOKEN: Optional[str] = None
    DEVICE: str = "cpu"

    class Config:
        env_file = ".env"


settings = Settings()
