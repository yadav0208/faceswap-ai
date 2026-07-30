from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── Auth Schemas ───────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr = Field(..., max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(default=None, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str


class PhoneOtpRequest(BaseModel):
    phone_number: str = Field(..., min_length=8, max_length=20)
    purpose: str = Field(default="login", pattern="^(login|register)$")


class PhoneOtpVerify(BaseModel):
    phone_number: str = Field(..., min_length=8, max_length=20)
    code: str = Field(..., min_length=6, max_length=6)
    full_name: Optional[str] = Field(default=None, max_length=100)


class OtpRequestOut(BaseModel):
    message: str
    expires_in: int = 300
    development_code: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    is_active: bool
    created_at: datetime
    phone_number: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProfileStats(BaseModel):
    images: int
    videos: int
    total_creations: int


class UserProfileUpdate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=6, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    new_password: str = Field(..., min_length=8, max_length=128)


# ─── Pose Template Schemas ───────────────────────────────────────────────────

class PoseTemplateOut(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str]
    template_image_url: str
    thumbnail_url: Optional[str]
    is_premium: bool
    sort_order: int

    class Config:
        from_attributes = True


# ─── Generation Schemas ──────────────────────────────────────────────────────

class GenerationCreate(BaseModel):
    pose_template_id: int
    gender: Optional[str] = "auto"
    skin_tone: Optional[str] = None
    style_prompt: Optional[str] = None


class GenerationOut(BaseModel):
    id: int
    pose_template_id: int
    source_image_url: str
    result_image_url: Optional[str]
    status: str
    error_message: Optional[str]
    style_prompt: Optional[str]
    gender: Optional[str]
    confidence_score: Optional[float]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class GenerationStatus(BaseModel):
    id: int
    status: str
    result_image_url: Optional[str]
    error_message: Optional[str]
    progress: Optional[int] = None  # 0-100


# ─── Save Look ───────────────────────────────────────────────────────────────

class SaveLookRequest(BaseModel):
    generation_id: int
    title: Optional[str] = None
