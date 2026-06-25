"""
Seed the database with pose templates and generate template images.
Run once on startup if DB is empty.
"""
import os
import asyncio
from pathlib import Path
from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models import PoseTemplate
from app.ai.pose_generator import generate_pose_template, generate_thumbnail, POSES, STYLE_PALETTES
from app.config import settings
import logging

logger = logging.getLogger(__name__)

TEMPLATE_DEFINITIONS = [
    # Fashion
    {"name": "Classic Standing", "category": "fashion", "pose": "standing_front",
     "description": "Elegant upright stance for fashion shots", "sort_order": 1},
    {"name": "Power Pose", "category": "fashion", "pose": "power_pose",
     "description": "Confident hands-on-hips look", "sort_order": 2},
    {"name": "Crossed Arms", "category": "fashion", "pose": "crossed_arms",
     "description": "Strong crossed-arms editorial pose", "sort_order": 3},

    # Casual
    {"name": "Casual Walk", "category": "casual", "pose": "walking",
     "description": "Natural walking stride", "sort_order": 4},
    {"name": "Thoughtful Pose", "category": "casual", "pose": "hand_on_chin",
     "description": "Hand on chin contemplative look", "sort_order": 5},
    {"name": "Side Profile", "category": "casual", "pose": "side_profile",
     "description": "Elegant side view pose", "sort_order": 6},

    # Formal
    {"name": "Business Stand", "category": "formal", "pose": "standing_front",
     "description": "Professional upright business pose", "sort_order": 7},
    {"name": "Executive Power", "category": "formal", "pose": "crossed_arms",
     "description": "Authoritative executive stance", "sort_order": 8},

    # Sports
    {"name": "Athletic Stride", "category": "sports", "pose": "walking",
     "description": "Dynamic athletic walking pose", "sort_order": 9},
    {"name": "Champion Pose", "category": "sports", "pose": "power_pose",
     "description": "Victory champion stance", "sort_order": 10},

    # Beach
    {"name": "Beach Casual", "category": "beach", "pose": "standing_front",
     "description": "Relaxed beach standing pose", "sort_order": 11},
    {"name": "Sunset Walk", "category": "beach", "pose": "walking",
     "description": "Breezy beach walking look", "sort_order": 12},

    # Party
    {"name": "Party Ready", "category": "party", "pose": "power_pose",
     "description": "Night-out confidence pose", "sort_order": 13, "is_premium": True},
    {"name": "Glam Shot", "category": "party", "pose": "side_profile",
     "description": "Glamorous side profile", "sort_order": 14, "is_premium": True},
]


async def seed_templates():
    """Generate template images and insert DB records."""
    await init_db()

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(PoseTemplate).limit(1))
        if result.scalar_one_or_none():
            logger.info("Database already seeded, skipping.")
            return

        logger.info("Seeding pose templates...")
        templates_dir = Path(settings.POSE_TEMPLATES_DIR)
        templates_dir.mkdir(parents=True, exist_ok=True)
        thumbs_dir = templates_dir / "thumbs"
        thumbs_dir.mkdir(parents=True, exist_ok=True)

        for defn in TEMPLATE_DEFINITIONS:
            img_name = f"{defn['category']}_{defn['pose']}_{defn['sort_order']}.jpg"
            thumb_name = f"thumb_{img_name}"
            img_path = str(templates_dir / img_name)
            thumb_path = str(thumbs_dir / thumb_name)

            # Generate image
            success = generate_pose_template(
                pose_name=defn["pose"],
                category=defn["category"],
                output_path=img_path,
                size=(400, 600),
            )

            if success:
                generate_thumbnail(img_path, thumb_path)

            template = PoseTemplate(
                name=defn["name"],
                category=defn["category"],
                description=defn.get("description"),
                template_image_path=img_path,
                thumbnail_path=thumb_path if success else None,
                is_premium=defn.get("is_premium", False),
                sort_order=defn["sort_order"],
            )
            db.add(template)

        await db.commit()
        logger.info(f"Seeded {len(TEMPLATE_DEFINITIONS)} pose templates.")


if __name__ == "__main__":
    asyncio.run(seed_templates())
