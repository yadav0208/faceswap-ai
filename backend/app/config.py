from pydantic_settings import BaseSettings
from typing import Optional
from urllib.parse import urlparse


class Settings(BaseSettings):
    APP_NAME: str = "Anva AI"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    DATABASE_URL: str = "sqlite+aiosqlite:///./faceswap.db"
    UPLOAD_DIR: str = "uploads"
    OUTPUT_DIR: str = "outputs"
    POSE_TEMPLATES_DIR: str = "pose_templates"

    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_ORIGINS: str = "http://localhost:8081,http://127.0.0.1:8081"
    TRUSTED_HOSTS: str = "localhost,127.0.0.1"
    ENABLE_DOCS: bool = True

    IMAGE_PROVIDER: str = "magic_hour"
    FACE_SWAP_PROVIDER: str = "magic_hour"
    MAGIC_HOUR_API_KEY: Optional[str] = None
    MAGIC_HOUR_IMAGE_MODEL: str = "flux-schnell"
    AI_REQUEST_TIMEOUT_SECONDS: int = 300
    OTP_EXPIRY_SECONDS: int = 300
    OTP_DEVELOPMENT_MODE: bool = False
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_API_KEY_SID: Optional[str] = None
    TWILIO_API_KEY_SECRET: Optional[str] = None
    TWILIO_FROM_NUMBER: Optional[str] = None
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_USE_TLS: bool = True

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def trusted_hosts(self) -> list[str]:
        return [host.strip() for host in self.TRUSTED_HOSTS.split(",") if host.strip()]

    @property
    def async_database_url(self) -> str:
        """Accept Railway's MYSQL_URL while using SQLAlchemy's async driver."""
        if self.DATABASE_URL.startswith("mysql://"):
            return self.DATABASE_URL.replace("mysql://", "mysql+asyncmy://", 1)
        if self.DATABASE_URL.startswith("mysql+pymysql://"):
            return self.DATABASE_URL.replace("mysql+pymysql://", "mysql+asyncmy://", 1)
        return self.DATABASE_URL

    @property
    def twilio_basic_auth(self) -> tuple[str, str] | None:
        if self.TWILIO_API_KEY_SID and self.TWILIO_API_KEY_SECRET:
            return self.TWILIO_API_KEY_SID, self.TWILIO_API_KEY_SECRET
        if self.TWILIO_ACCOUNT_SID and self.TWILIO_AUTH_TOKEN:
            return self.TWILIO_ACCOUNT_SID, self.TWILIO_AUTH_TOKEN
        return None

    @property
    def twilio_ready(self) -> bool:
        return bool(
            self.TWILIO_ACCOUNT_SID
            and self.TWILIO_FROM_NUMBER
            and self.twilio_basic_auth
        )

    def validate_runtime(self) -> None:
        if not self.is_production:
            return
        errors: list[str] = []
        if len(self.SECRET_KEY) < 32 or self.SECRET_KEY.startswith("dev-"):
            errors.append("SECRET_KEY must be a random value of at least 32 characters")
        if not self.allowed_origins or "*" in self.allowed_origins:
            errors.append("ALLOWED_ORIGINS must contain explicit HTTPS app origins")
        if any(urlparse(origin).scheme != "https" for origin in self.allowed_origins):
            errors.append("every production ALLOWED_ORIGINS entry must use HTTPS")
        if self.DATABASE_URL.startswith("sqlite"):
            errors.append("DATABASE_URL must use a persistent production MySQL database")
        if errors:
            raise RuntimeError("Invalid production configuration: " + "; ".join(errors))

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
