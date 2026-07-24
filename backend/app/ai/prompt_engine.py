"""Central prompt construction for every Anva studio."""
from __future__ import annotations

import re


STUDIO_PROMPTS: dict[str, str] = {
    "ai_videos": "cinematic character video keyframe, dynamic composition, natural motion",
    "photo_styles": "editorial portrait, authentic skin texture, fashion photography",
    "birthday": "luxury birthday photoshoot, celebratory lighting, elegant decorations",
    "stadium_cam": "live stadium crowd, broadcast camera realism, energetic atmosphere",
    "horse_riding": "cinematic horse riding scene, believable anatomy, sweeping landscape",
    "fantasy_armor": "epic fantasy warrior portrait, detailed armor, cinematic atmosphere",
    "dance_video": "dynamic dance performance keyframe, full-body movement, stage lighting",
    "talking_photo": "natural speaking portrait, direct eye contact, expressive face",
    "retro_1996": "authentic 1990s analog film portrait, subtle grain, period color science",
    "futuristic_2026": "near-future editorial portrait, refined technology, cinematic neon",
    "anime_style": "high-quality anime character illustration, clean linework, detailed shading",
    "ai_portrait": "professional studio headshot, flattering softbox lighting, clean backdrop",
    "birthday_queen": "regal birthday portrait, elegant crown, premium celebration styling",
    "wedding_look": "luxury wedding editorial, soft romantic light, detailed formal clothing",
    "graduation": "professional graduation portrait, cap and gown, proud celebratory mood",
    "kids_cartoon": "family-friendly animated adventure character, colorful cinematic scene",
    "kids_superhero": "family-friendly original superhero portrait, heroic pose, vibrant scene",
    "kids_fairy_tale": "family-friendly fairy-tale portrait, magical storybook environment",
    "kids_space": "family-friendly astronaut adventure, wondrous outer-space environment",
    "face_swap": "photorealistic portrait composite, matching light, perspective and skin tone",
    "outfit_tryon": "realistic fashion try-on, accurate garment drape, editorial full-body photo",
    "age_filter": "photorealistic age transformation, preserve identity and facial structure",
    "custom_generator": "premium cinematic image",
}

STYLE_PROMPTS: dict[str, str] = {
    "linkedin": "professional LinkedIn headshot, approachable expression",
    "film_noir": "black-and-white film noir, hard rim light, deep shadows",
    "polaroid": "instant-film photograph, soft highlights, subtle analog texture",
    "manga": "detailed manga illustration, expressive ink work",
    "ghibli": "hand-painted whimsical animation, warm natural palette",
    "chibi": "chibi character design, charming proportions, polished illustration",
    "cyberpunk": "cinematic cyberpunk lighting, cyan and magenta accents",
    "knight": "dark medieval knight, intricate plate armor",
    "warrior": "battle-ready fantasy warrior, practical detailed armor",
    "elf": "elegant elven archer, enchanted forest atmosphere",
    "mage": "powerful fantasy mage, subtle magical energy",
    "young": "approximately twenty years younger",
    "old": "approximately thirty years older",
    "teen": "teenage appearance",
    "elder": "elderly appearance with natural age detail",
}

QUALITY_SUFFIX = (
    "centered subject, coherent anatomy, realistic hands and eyes, balanced composition, "
    "professional color grading, crisp detail, high resolution"
)


def clean_prompt(value: str | None, max_length: int = 600) -> str:
    """Normalize user text before it is saved or sent to a model."""
    text = re.sub(r"\s+", " ", (value or "").strip())
    return text[:max_length]


def build_generation_prompt(
    studio_id: str,
    pose_id: str = "",
    user_prompt: str | None = None,
) -> str:
    """Create a consistent, model-ready prompt while keeping user intent first."""
    parts = []
    cleaned = clean_prompt(user_prompt)
    if cleaned:
        parts.append(cleaned)
    parts.append(STUDIO_PROMPTS.get(studio_id, STUDIO_PROMPTS["custom_generator"]))
    if pose_id:
        parts.append(STYLE_PROMPTS.get(pose_id, pose_id.replace("_", " ")))
    parts.append(QUALITY_SUFFIX)
    return ", ".join(dict.fromkeys(part for part in parts if part))

