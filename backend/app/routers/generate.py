import os
import uuid
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.database import get_db, engine
from app.models import Generation, PoseTemplate, User
from app.schemas import GenerationOut, GenerationStatus
from app.auth import get_current_user
from app.config import settings
from app.ai.image_processor import image_processor, VIDEO_STUDIOS
from app.ai.face_detector import face_detector
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/generate", tags=["generate"])


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


async def _run_generation(generation_id: int, studio_id: str, pose_id: str):
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
    gender: str = Form("auto"),
    style_prompt: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
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

    detection = face_detector.detect(upload_path)
    if not detection.get("detected"):
        os.remove(upload_path)
        raise HTTPException(
            422,
            detail="No face detected. Please upload a clear, front-facing photo.",
        )

    template = await _get_template(db, pose_template_id)
    if not template:
        os.remove(upload_path)
        raise HTTPException(404, detail="No pose templates found. Restart the server.")

    gen = Generation(
        user_id=current_user.id if current_user else None,
        pose_template_id=template.id,
        source_image_path=upload_path,
        gender=gender,
        style_prompt=style_prompt,
        status="pending",
        confidence_score=detection.get("confidence"),
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)
    background_tasks.add_task(_run_generation, gen.id, studio_id, pose_id)
    return _gen_to_schema(gen)


# ── Prompt-only generation (Custom Generator — no file needed) ────────────────
@router.post("/prompt", response_model=GenerationOut, status_code=202)
async def create_prompt_generation(
    background_tasks: BackgroundTasks,
    prompt: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Generate an image from a text prompt — no photo upload required."""
    if not prompt.strip():
        raise HTTPException(400, detail="Prompt cannot be empty.")

    template = await _get_template(db, 1)
    if not template:
        raise HTTPException(404, detail="No templates found. Restart the server.")

    gen = Generation(
        user_id=current_user.id if current_user else None,
        pose_template_id=template.id,
        source_image_path="prompt_only",   # sentinel value
        gender="auto",
        style_prompt=prompt.strip(),
        status="pending",
        confidence_score=None,
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)
    background_tasks.add_task(_run_generation, gen.id, "custom_generator", "default")
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
    current_user: Optional[User] = Depends(get_current_user),
):
    if not current_user:
        return []
    result = await db.execute(
        select(Generation)
        .where(Generation.user_id == current_user.id)
        .order_by(Generation.created_at.desc())
        .limit(50)
    )
    return [_gen_to_schema(g) for g in result.scalars().all()]


@router.get("/{generation_id}/status", response_model=GenerationStatus)
async def get_status(generation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Generation).where(Generation.id == generation_id))
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(404, detail="Generation not found")
    progress = {"pending": 10, "processing": 65, "completed": 100, "failed": 0}.get(gen.status, 0)
    return GenerationStatus(
        id=gen.id,
        status=gen.status,
        result_image_url=f"/api/generate/{gen.id}/result" if gen.result_image_path else None,
        error_message=gen.error_message,
        progress=progress,
    )


@router.get("/{generation_id}/result")
async def get_result_image(generation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Generation).where(Generation.id == generation_id))
    gen = result.scalar_one_or_none()
    if not gen or not gen.result_image_path:
        raise HTTPException(404, detail="Result not available yet")
    if not os.path.exists(gen.result_image_path):
        raise HTTPException(404, detail="Result file not found on disk")
    # Serve mp4 as video, otherwise jpeg
    media_type = "video/mp4" if gen.result_image_path.endswith(".mp4") else "image/jpeg"
    return FileResponse(gen.result_image_path, media_type=media_type)


@router.get("/{generation_id}/source")
async def get_source_image(generation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Generation).where(Generation.id == generation_id))
    gen = result.scalar_one_or_none()
    if not gen or gen.source_image_path == "prompt_only":
        raise HTTPException(404, detail="No source image for this generation")
    if not os.path.exists(gen.source_image_path):
        raise HTTPException(404, detail="Source not found")
    return FileResponse(gen.source_image_path, media_type="image/jpeg")
