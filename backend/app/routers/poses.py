from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models import PoseTemplate
from app.schemas import PoseTemplateOut
from app.config import settings
import os

router = APIRouter(prefix="/api/poses", tags=["poses"])


def _template_to_schema(t: PoseTemplate) -> PoseTemplateOut:
    base = str(settings.POSE_TEMPLATES_DIR)
    return PoseTemplateOut(
        id=t.id,
        name=t.name,
        category=t.category,
        description=t.description,
        template_image_url=f"/api/poses/{t.id}/image",
        thumbnail_url=f"/api/poses/{t.id}/thumbnail",
        is_premium=t.is_premium,
        sort_order=t.sort_order,
    )


@router.get("", response_model=List[PoseTemplateOut])
async def list_poses(
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(PoseTemplate).order_by(PoseTemplate.sort_order, PoseTemplate.id)
    if category:
        query = query.where(PoseTemplate.category == category)
    result = await db.execute(query)
    templates = result.scalars().all()
    return [_template_to_schema(t) for t in templates]


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PoseTemplate.category).distinct())
    categories = [row[0] for row in result.all()]
    return {"categories": categories}


@router.get("/{pose_id}/image")
async def get_pose_image(pose_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PoseTemplate).where(PoseTemplate.id == pose_id))
    template = result.scalar_one_or_none()
    if not template:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Pose not found")

    path = template.template_image_path
    if os.path.exists(path):
        return FileResponse(path, media_type="image/jpeg")
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Image file not found")


@router.get("/{pose_id}/thumbnail")
async def get_pose_thumbnail(pose_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PoseTemplate).where(PoseTemplate.id == pose_id))
    template = result.scalar_one_or_none()
    if not template:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Pose not found")

    path = template.thumbnail_path or template.template_image_path
    if os.path.exists(path):
        return FileResponse(path, media_type="image/jpeg")
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Thumbnail not found")
