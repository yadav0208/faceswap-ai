import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.database import get_db, engine
from app.models import Generation, PoseTemplate, User
from app.schemas import GenerationOut, GenerationStatus
from app.auth import create_access_token, get_current_user, require_current_user
from jose import JWTError, jwt
from app.config import settings
from app.ai.image_processor import image_processor, VIDEO_STUDIOS
from app.ai.face_detector import face_detector
from app.ai.prompt_engine import build_generation_prompt, clean_prompt
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/generate", tags=["generate"])


def _media_owner(access: str, generation_id: int) -> int:
    try:
        payload = jwt.decode(access, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("scope") != "generation_media" or int(payload.get("generation_id")) != generation_id:
            raise ValueError
        return int(payload["sub"])
    except (JWTError, KeyError, TypeError, ValueError):
        raise HTTPException(401, detail="Media link is invalid or expired")


def _local_enhance_prompt(prompt: str) -> str:
    """Useful no-key fallback for prompt enhancement."""
    return (
        f"{clean_prompt(prompt)}, clear primary subject, intentional composition, "
        "cinematic depth, realistic materials and fine texture, professional lighting, "
        "balanced color palette, sharp focal detail, high-end editorial finish"
    )


@router.post("/enhance-prompt")
async def enhance_prompt(prompt: str = Form(...)):
    prompt = clean_prompt(prompt)
    if len(prompt) < 3:
        raise HTTPException(400, detail="Enter at least three characters.")
    return {"prompt": _local_enhance_prompt(prompt), "provider": "Anva local enhancer"}


def _gen_to_schema(g: Generation) -> GenerationOut:
    return GenerationOut(
        id=g.id,
        pose_template_id=g.pose_template_id,
        source_image_url=f"/api/generate/{g.id}/source",
        result_image_url=f"/api/generate/{g.id}/result" if g.result_image_path else None,
        status=g.status,
        error_message=g.error_message,
        style_prompt=g.style_prompt,
        gender=g.gender,
        confidence_score=g.confidence_score,
        created_at=g.created_at,
        completed_at=g.completed_at,
    )


async def _run_generation(
    generation_id: int,
    studio_id: str,
    pose_id: str,
    motion_id: str = "",
    audio_path: Optional[str] = None,
    voice_text: Optional[str] = None,
    voice_name: Optional[str] = None,
):
    """Background task with its own DB session."""
    from sqlalchemy.ext.asyncio import async_sessionmaker
    AsyncSession_local = async_sessionmaker(engine, expire_on_commit=False)

    async with AsyncSession_local() as db:
        result = await db.execute(select(Generation).where(Generation.id == generation_id))
        gen = result.scalar_one_or_none()
        if not gen:
            return

        result_tpl = await db.execute(
            select(PoseTemplate).where(PoseTemplate.id == gen.pose_template_id)
        )
        template = result_tpl.scalar_one_or_none()
        if not template:
            gen.status = "failed"
            gen.error_message = "Pose template not found"
            await db.commit()
            return

        gen.status = "processing"
        await db.commit()

        is_video = studio_id in VIDEO_STUDIOS
        ext = ".mp4" if is_video else ".jpg"
        output_filename = f"result_{generation_id}_{uuid.uuid4().hex[:8]}{ext}"
        output_path = os.path.join(settings.OUTPUT_DIR, output_filename)

        # Prompt-only path — no source image
        is_prompt_only = gen.source_image_path == "prompt_only"

        success, error = await image_processor.generate(
            source_image_path=gen.source_image_path,
            template_image_path=template.template_image_path,
            output_path=output_path,
            gender=gen.gender or "auto",
            style_prompt=gen.style_prompt,
            studio_id=studio_id,
            pose_id=pose_id,
            motion_id=motion_id,
            audio_path=audio_path,
            voice_text=voice_text,
            voice_name=voice_name,
        )

        # Video fallback: if mp4 not written, check for _frame.jpg
        if not success and is_video:
            jpg_fallback = output_path.replace(".mp4", "_frame.jpg")
            if os.path.exists(jpg_fallback):
                output_path = jpg_fallback
                success = True
                error = None

        if success:
            # For video: prefer mp4, but accept jpg fallback
            if is_video and not os.path.exists(output_path):
                jpg_path = output_path.replace(".mp4", "_frame.jpg")
                if os.path.exists(jpg_path):
                    output_path = jpg_path
            gen.status = "completed"
            gen.result_image_path = output_path
            gen.completed_at = datetime.utcnow()
            logger.info(f"Generation {generation_id} completed: {output_path}")
        else:
            gen.status = "failed"
            gen.error_message = error or "Generation failed"
            logger.error(f"Generation {generation_id} failed: {error}")

        await db.commit()


# ── Standard generation (requires image upload) ───────────────────────────────
@router.post("", response_model=GenerationOut, status_code=202)
async def create_generation(
    background_tasks: BackgroundTasks,
    pose_template_id: int = Form(...),
    studio_id: str = Form(""),
    pose_id: str = Form(""),
    motion_id: str = Form(""),
    gender: str = Form("auto"),
    style_prompt: Optional[str] = Form(None),
    file: UploadFile = File(...),
    audio: Optional[UploadFile] = File(None),
    voice_text: Optional[str] = Form(None),
    voice_name: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    ct = file.content_type or ""
    if not (ct.startswith("image/") or ct == "application/octet-stream"):
        raise HTTPException(400, detail=f"Unsupported file type: {ct}. Upload a JPEG or PNG.")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(413, detail="File too large (max 10 MB)")

    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    upload_path = os.path.join(settings.UPLOAD_DIR, f"upload_{uuid.uuid4().hex}.jpg")
    with open(upload_path, "wb") as f:
        f.write(content)

    audio_path = None
    if studio_id == "talking_photo":
        cleaned_voice_text = clean_prompt(voice_text, max_length=500)
        if not audio and not cleaned_voice_text:
            os.remove(upload_path)
            raise HTTPException(400, detail="Upload audio or enter a voice script.")
        if audio:
            audio_content = await audio.read()
            if len(audio_content) > 25 * 1024 * 1024:
                os.remove(upload_path)
                raise HTTPException(413, detail="Audio is too large (max 25 MB).")
            audio_suffix = Path(audio.filename or "speech.mp3").suffix.lower()
            if audio_suffix not in {".mp3", ".mpeg", ".wav", ".aac", ".aiff", ".flac"}:
                os.remove(upload_path)
                raise HTTPException(400, detail="Use MP3, WAV, AAC, AIFF, or FLAC audio.")
            audio_path = os.path.join(
                settings.UPLOAD_DIR, f"audio_{uuid.uuid4().hex}{audio_suffix}"
            )
            with open(audio_path, "wb") as audio_file:
                audio_file.write(audio_content)
    else:
        cleaned_voice_text = ""

    detection = face_detector.detect(upload_path)
    if not detection.get("detected"):
        os.remove(upload_path)
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        raise HTTPException(
            422,
            detail="No face detected. Please upload a clear, front-facing photo.",
        )

    template = await _get_template(db, pose_template_id)
    if not template:
        os.remove(upload_path)
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        raise HTTPException(404, detail="No pose templates found. Restart the server.")

    gen = Generation(
        user_id=current_user.id,
        pose_template_id=template.id,
        source_image_path=upload_path,
        gender=gender,
        style_prompt=build_generation_prompt(studio_id, pose_id, style_prompt),
        status="pending",
        confidence_score=detection.get("confidence"),
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)
    background_tasks.add_task(
        _run_generation, gen.id, studio_id, pose_id, motion_id, audio_path,
        cleaned_voice_text, voice_name
    )
    return _gen_to_schema(gen)


# ── Prompt-only generation (Custom Generator — no file needed) ────────────────
@router.post("/prompt", response_model=GenerationOut, status_code=202)
async def create_prompt_generation(
    background_tasks: BackgroundTasks,
    prompt: str = Form(...),
    generation_type: str = Form("image"),
    domain: str = Form("kids"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    """Generate an image from a text prompt — no photo upload required."""
    prompt = clean_prompt(prompt)
    if len(prompt) < 3:
        raise HTTPException(400, detail="Prompt cannot be empty.")

    template = await _get_template(db, 1)
    if not template:
        raise HTTPException(404, detail="No templates found. Restart the server.")

    is_video = generation_type == "video"
    studio_id = "kids_text_video" if is_video else "custom_generator"
    domain_prefix = (
        "Kids domain, child-safe, family-friendly, age-appropriate. "
        if domain == "kids"
        else ""
    )
    gen = Generation(
        user_id=current_user.id,
        pose_template_id=template.id,
        source_image_path="prompt_only",   # sentinel value
        gender="auto",
        style_prompt=build_generation_prompt(
            studio_id, user_prompt=f"{domain_prefix}{prompt}"
        ),
        status="pending",
        confidence_score=None,
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)
    background_tasks.add_task(_run_generation, gen.id, studio_id, "default")
    return _gen_to_schema(gen)


# ── Helpers ───────────────────────────────────────────────────────────────────
async def _get_template(db: AsyncSession, template_id: int) -> Optional[PoseTemplate]:
    result = await db.execute(select(PoseTemplate).where(PoseTemplate.id == template_id))
    t = result.scalar_one_or_none()
    if not t:
        result = await db.execute(select(PoseTemplate).limit(1))
        t = result.scalar_one_or_none()
    return t


# ── Status / result endpoints ─────────────────────────────────────────────────
@router.get("/history", response_model=list[GenerationOut])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    result = await db.execute(
        select(Generation)
        .where(Generation.user_id == current_user.id)
        .order_by(Generation.created_at.desc())
        .limit(50)
    )
    return [_gen_to_schema(g) for g in result.scalars().all()]


@router.get("/{generation_id}/status", response_model=GenerationStatus)
async def get_status(
    generation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    result = await db.execute(
        select(Generation).where(
            Generation.id == generation_id,
            Generation.user_id == current_user.id,
        )
    )
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(404, detail="Generation not found")
    progress = {"pending": 10, "processing": 65, "completed": 100, "failed": 0}.get(gen.status, 0)
    media_access = create_access_token(
        {
            "sub": str(current_user.id),
            "scope": "generation_media",
            "generation_id": gen.id,
        },
        expires_delta=timedelta(minutes=15),
    )
    return GenerationStatus(
        id=gen.id,
        status=gen.status,
        result_image_url=f"/api/generate/{gen.id}/result?access={media_access}" if gen.result_image_path else None,
        error_message=gen.error_message,
        progress=progress,
    )


@router.get("/{generation_id}/result")
async def get_result_image(
    generation_id: int,
    access: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    owner_id = _media_owner(access, generation_id)
    result = await db.execute(
        select(Generation).where(
            Generation.id == generation_id,
            Generation.user_id == owner_id,
        )
    )
    gen = result.scalar_one_or_none()
    if not gen or not gen.result_image_path:
        raise HTTPException(404, detail="Result not available yet")
    if not os.path.exists(gen.result_image_path):
        raise HTTPException(404, detail="Result file not found on disk")
    # Serve mp4 as video, otherwise jpeg
    media_type = "video/mp4" if gen.result_image_path.endswith(".mp4") else "image/jpeg"
    return FileResponse(gen.result_image_path, media_type=media_type)


@router.get("/{generation_id}/source")
async def get_source_image(
    generation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    result = await db.execute(
        select(Generation).where(
            Generation.id == generation_id,
            Generation.user_id == current_user.id,
        )
    )
    gen = result.scalar_one_or_none()
    if not gen or gen.source_image_path == "prompt_only":
        raise HTTPException(404, detail="No source image for this generation")
    if not os.path.exists(gen.source_image_path):
        raise HTTPException(404, detail="Source not found")
    return FileResponse(gen.source_image_path, media_type="image/jpeg")
