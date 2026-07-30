from datetime import datetime, timedelta
import asyncio
import re
import secrets
import smtplib
import uuid
from email.message import EmailMessage
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models import Generation, PasswordResetCode, PhoneIdentity, PhoneOtp, User
from app.schemas import (
    OtpRequestOut, PasswordChange, PasswordResetConfirm, PasswordResetRequest,
    PhoneOtpRequest, PhoneOtpVerify, ProfileStats, UserProfileUpdate,
    UserRegister, UserLogin, UserOut, Token,
)
from app.auth import (
    create_access_token,
    hash_one_time_code,
    hash_password,
    require_current_user,
    verify_one_time_code,
    verify_password,
)
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _send_reset_email(email: str, code: str) -> None:
    message = EmailMessage()
    message["Subject"] = "Reset your Anva AI password"
    message["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    message["To"] = email
    message.set_content(
        f"Your Anva AI password reset code is {code}. "
        f"It expires in {settings.OTP_EXPIRY_SECONDS // 60} minutes."
    )
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(message)


def _normalize_phone(value: str) -> str:
    phone = re.sub(r"[^\d+]", "", value.strip())
    if phone.startswith("00"):
        phone = "+" + phone[2:]
    if not re.fullmatch(r"\+[1-9]\d{7,14}", phone):
        raise HTTPException(400, detail="Use an international number such as +919876543210.")
    return phone


async def _user_out(user: User, db: AsyncSession) -> UserOut:
    phone_result = await db.execute(
        select(PhoneIdentity.phone_number).where(PhoneIdentity.user_id == user.id)
    )
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        created_at=user.created_at,
        phone_number=phone_result.scalar_one_or_none(),
    )


async def _token_for(user: User, db: AsyncSession) -> Token:
    return Token(
        access_token=create_access_token({"sub": str(user.id)}),
        user=await _user_out(user, db),
    )


@router.post("/register", response_model=Token, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    username = data.username.strip().lower()
    email = str(data.email).strip().lower()

    # Check duplicates
    existing = await db.execute(
        select(User).where((User.username == username) | (User.email == email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name.strip() if data.full_name else None,
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        # A concurrent request may insert the same unique value after the check.
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )
    await db.refresh(user)

    return await _token_for(user, db)


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    identifier = data.username.strip().lower()
    result = await db.execute(
        select(User).where(
            (User.username == identifier) | (User.email == identifier)
        )
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    return await _token_for(user, db)


@router.post("/phone/request-otp", response_model=OtpRequestOut)
async def request_phone_otp(data: PhoneOtpRequest, db: AsyncSession = Depends(get_db)):
    phone = _normalize_phone(data.phone_number)
    sms_configured = settings.twilio_ready
    if not sms_configured and not settings.OTP_DEVELOPMENT_MODE:
        raise HTTPException(503, detail="SMS delivery is not configured.")

    recent = await db.execute(
        select(PhoneOtp)
        .where(PhoneOtp.phone_number == phone)
        .order_by(PhoneOtp.created_at.desc())
        .limit(1)
    )
    last = recent.scalar_one_or_none()
    if last and last.created_at > datetime.utcnow() - timedelta(seconds=60):
        raise HTTPException(429, detail="Please wait before requesting another code.")

    code = f"{secrets.randbelow(1_000_000):06d}"
    otp = PhoneOtp(
        phone_number=phone,
        purpose=data.purpose,
        code_hash=hash_one_time_code(code),
        expires_at=datetime.utcnow() + timedelta(seconds=settings.OTP_EXPIRY_SECONDS),
    )
    db.add(otp)

    if sms_configured:
        url = (
            f"https://api.twilio.com/2010-04-01/Accounts/"
            f"{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        )
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                url,
                data={
                    "To": phone,
                    "From": settings.TWILIO_FROM_NUMBER,
                    "Body": f"Your Anva AI verification code is {code}. It expires in 5 minutes.",
                },
                auth=settings.twilio_basic_auth,
            )
        if response.status_code >= 400:
            await db.rollback()
            raise HTTPException(502, detail="Could not send the verification code.")
    await db.commit()

    return OtpRequestOut(
        message="Verification code sent.",
        expires_in=settings.OTP_EXPIRY_SECONDS,
        development_code=code if settings.OTP_DEVELOPMENT_MODE else None,
    )


@router.post("/phone/verify-otp", response_model=Token)
async def verify_phone_otp(data: PhoneOtpVerify, db: AsyncSession = Depends(get_db)):
    phone = _normalize_phone(data.phone_number)
    result = await db.execute(
        select(PhoneOtp)
        .where(PhoneOtp.phone_number == phone, PhoneOtp.consumed_at.is_(None))
        .order_by(PhoneOtp.created_at.desc())
        .limit(1)
    )
    otp = result.scalar_one_or_none()
    if not otp or otp.expires_at < datetime.utcnow():
        raise HTTPException(400, detail="Code expired. Request a new one.")
    if otp.attempts >= 5:
        raise HTTPException(429, detail="Too many attempts. Request a new code.")
    otp.attempts += 1
    if not verify_one_time_code(data.code, otp.code_hash):
        await db.commit()
        raise HTTPException(400, detail="Incorrect verification code.")
    otp.consumed_at = datetime.utcnow()

    identity_result = await db.execute(
        select(PhoneIdentity).where(PhoneIdentity.phone_number == phone)
    )
    identity = identity_result.scalar_one_or_none()
    if identity:
        user_result = await db.execute(select(User).where(User.id == identity.user_id))
        user = user_result.scalar_one()
    else:
        suffix = uuid.uuid4().hex[:10]
        user = User(
            username=f"mobile_{suffix}",
            email=f"{suffix}@mobile.anva.local",
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            full_name=(data.full_name or "Anva Creator").strip(),
        )
        db.add(user)
        await db.flush()
        db.add(PhoneIdentity(user_id=user.id, phone_number=phone))
    await db.commit()
    await db.refresh(user)
    return await _token_for(user, db)


@router.post("/password/forgot", response_model=OtpRequestOut)
async def forgot_password(data: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    generic_message = "If that email is registered, a reset code has been sent."
    if not user or user.email.endswith("@mobile.anva.local"):
        return OtpRequestOut(message=generic_message, expires_in=settings.OTP_EXPIRY_SECONDS)

    recent = await db.execute(
        select(PasswordResetCode)
        .where(PasswordResetCode.user_id == user.id)
        .order_by(PasswordResetCode.created_at.desc())
        .limit(1)
    )
    last = recent.scalar_one_or_none()
    if last and last.created_at > datetime.utcnow() - timedelta(seconds=60):
        raise HTTPException(429, detail="Please wait before requesting another reset code.")

    code = f"{secrets.randbelow(1_000_000):06d}"
    db.add(
        PasswordResetCode(
            user_id=user.id,
            code_hash=hash_one_time_code(code),
            expires_at=datetime.utcnow() + timedelta(seconds=settings.OTP_EXPIRY_SECONDS),
        )
    )

    email_configured = bool(settings.SMTP_HOST and (settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME))
    if email_configured:
        try:
            await asyncio.to_thread(_send_reset_email, email, code)
        except Exception:
            await db.rollback()
            raise HTTPException(502, detail="Could not send the password reset email.")
    elif not settings.OTP_DEVELOPMENT_MODE:
        await db.rollback()
        raise HTTPException(503, detail="Password reset email delivery is not configured.")

    await db.commit()
    return OtpRequestOut(
        message=generic_message,
        expires_in=settings.OTP_EXPIRY_SECONDS,
        development_code=code if settings.OTP_DEVELOPMENT_MODE else None,
    )


@router.post("/password/reset", status_code=204)
async def reset_password(data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    email = data.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(400, detail="Invalid or expired reset code.")

    code_result = await db.execute(
        select(PasswordResetCode)
        .where(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.consumed_at.is_(None),
        )
        .order_by(PasswordResetCode.created_at.desc())
        .limit(1)
    )
    reset_code = code_result.scalar_one_or_none()
    if not reset_code or reset_code.expires_at < datetime.utcnow():
        raise HTTPException(400, detail="Invalid or expired reset code.")
    if reset_code.attempts >= 5:
        raise HTTPException(429, detail="Too many attempts. Request a new reset code.")
    reset_code.attempts += 1
    if not verify_one_time_code(data.code, reset_code.code_hash):
        await db.commit()
        raise HTTPException(400, detail="Invalid or expired reset code.")

    reset_code.consumed_at = datetime.utcnow()
    user.hashed_password = hash_password(data.new_password)
    await db.commit()


@router.get("/me", response_model=UserOut)
async def get_me(
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _user_out(user, db)


@router.get("/stats", response_model=ProfileStats)
async def get_profile_stats(
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Generation.result_image_path).where(
            Generation.user_id == user.id,
            Generation.status == "completed",
        )
    )
    paths = [path for path in result.scalars().all() if path]
    videos = sum(path.lower().endswith(".mp4") for path in paths)
    images = len(paths) - videos
    return ProfileStats(images=images, videos=videos, total_creations=len(paths))


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserProfileUpdate,
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.full_name = data.full_name.strip()
    await db.commit()
    await db.refresh(user)
    return await _user_out(user, db)


@router.post("/change-password", status_code=204)
async def change_password(
    data: PasswordChange,
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.email.endswith("@mobile.anva.local"):
        raise HTTPException(400, detail="This mobile-only account signs in with OTP.")
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(400, detail="Current password is incorrect.")
    if data.current_password == data.new_password:
        raise HTTPException(400, detail="Choose a different new password.")
    user.hashed_password = hash_password(data.new_password)
    await db.commit()
