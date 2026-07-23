"""
Anva AI — Production image + video pipeline.

Modes
-----
1. Face-swap / style-photo  : user uploads photo → face placed on target scene
2. Prompt-to-image          : text prompt → styled synthetic image (no upload needed)
3. Animated video           : face-swapped frame → Ken-Burns / dance MP4

Style filters (OpenCV colour-grading):
  retro_1996, film_noir, sepia, vhs, futuristic_2026, neon, cyberpunk,
  anime, watercolour, birthday_glam, wedding, graduation, age_older, age_younger,
  kids_cartoon, fantasy, stadium, default
"""
from __future__ import annotations
import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Tuple
import logging
import asyncio
import urllib.request

logger = logging.getLogger(__name__)

# ── Studios that output MP4 ───────────────────────────────────────────────────
VIDEO_STUDIOS = {
    "ai_videos", "dance_video", "talking_photo",
    "horse_riding", "kids_cartoon", "kids_superhero",
    "kids_fairy_tale", "kids_space", "kids_dinosaur", "kids_underwater",
}

_CACHE_DIR = Path("pose_templates/cached_photos")
_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# ── Target photo URLs keyed by studio_id_pose_id ─────────────────────────────
POSE_PHOTO_URLS: dict[str, str] = {
    "face_swap_photo":    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "face_swap_celeb":    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "face_swap_movie":    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "face_swap_cartoon":  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=512&h=768&fit=crop&crop=faces&q=90",
    "ai_portrait_studio": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "ai_portrait_outdoor":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "ai_portrait_linkedin":"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=512&h=768&fit=crop&crop=faces&q=90",
    "ai_portrait_creative":"https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "photo_styles_retro_1996": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "photo_styles_future_2026":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "photo_styles_film_noir":  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "photo_styles_polaroid":   "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&crop=faces&q=90",
    "anime_style_manga":   "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "anime_style_ghibli":  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "anime_style_chibi":   "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=512&h=768&fit=crop&crop=faces&q=90",
    "anime_style_cyberpunk":"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "birthday_bday_queen": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "birthday_bday_pink":  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&crop=faces&q=90",
    "birthday_bday_candles":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "birthday_bday_outdoor":"https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "stadium_cam_football": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=512&h=768&fit=crop&q=90",
    "stadium_cam_concert":  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "stadium_cam_basketball":"https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=512&h=768&fit=crop&q=90",
    "stadium_cam_fan_zone": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&crop=faces&q=90",
    "horse_riding_snow":    "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=512&h=768&fit=crop&q=90",
    "horse_riding_beach":   "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "horse_riding_forest":  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "horse_riding_meadow":  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "fantasy_armor_knight": "https://images.unsplash.com/photo-1535666669445-e8c15cd2e7d9?w=512&h=768&fit=crop&q=90",
    "fantasy_armor_warrior":"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "fantasy_armor_elf":    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "fantasy_armor_mage":   "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&crop=faces&q=90",
    "dance_video_hiphop":   "https://images.unsplash.com/photo-1547153760-18fc86324498?w=512&h=768&fit=crop&q=90",
    "dance_video_salsa":    "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=512&h=768&fit=crop&q=90",
    "dance_video_kpop":     "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "dance_video_viral":    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&crop=faces&q=90",
    "talking_photo_natural":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "talking_photo_laugh":  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&crop=faces&q=90",
    "talking_photo_sing":   "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "talking_photo_wink":   "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "retro_1996_bw":        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "retro_1996_sepia":     "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&crop=faces&q=90",
    "retro_1996_vhs":       "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "retro_1996_grunge":    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "futuristic_2026_neon": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "futuristic_2026_cyber":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "futuristic_2026_ai_art":"https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "futuristic_2026_glitch":"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "wedding_look_bride":   "https://images.unsplash.com/photo-1519741497674-611481863552?w=512&h=768&fit=crop&q=90",
    "wedding_look_groom":   "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "wedding_look_couple":  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "wedding_look_aisle":   "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&crop=faces&q=90",
    "graduation_cap":       "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=512&h=768&fit=crop&q=90",
    "graduation_outdoor":   "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "graduation_party":     "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "graduation_formal":    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "birthday_queen_crown": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "birthday_queen_floral":"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&crop=faces&q=90",
    "birthday_queen_glam":  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "birthday_queen_casual":"https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "outfit_tryon_casual":  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=512&h=768&fit=crop&q=90",
    "outfit_tryon_formal":  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=512&h=768&fit=crop&q=90",
    "outfit_tryon_sport":   "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "outfit_tryon_party":   "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "age_filter_young":     "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=512&h=768&fit=crop&crop=faces&q=90",
    "age_filter_old":       "https://images.unsplash.com/photo-1601576084861-5de423553c0f?w=512&h=768&fit=crop&crop=faces&q=90",
    "age_filter_teen":      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=512&h=768&fit=crop&crop=faces&q=90",
    "age_filter_elder":     "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "kids_cartoon_superhero":"https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=512&h=768&fit=crop&crop=faces&q=90",
    "kids_cartoon_anime":   "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "kids_cartoon_fairy":   "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=512&h=768&fit=crop&crop=faces&q=90",
    "kids_superhero_marvel":"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "kids_superhero_dc":    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&crop=faces&q=90",
    "kids_fairy_tale_princess":"https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=512&h=768&fit=crop&crop=faces&q=90",
    "kids_fairy_tale_knight":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "kids_space_astronaut": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=512&h=768&fit=crop&q=90",
    "kids_space_alien":     "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "ai_videos_collage":    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&crop=faces&q=90",
    "ai_videos_cinematic":  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&crop=faces&q=90",
    "ai_videos_fantasy":    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&crop=faces&q=90",
    "ai_videos_dance":      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&crop=faces&q=90",
}


# ── Style → filter name mapping ───────────────────────────────────────────────
STYLE_MAP: dict[str, str] = {
    # retro
    "retro_1996": "retro", "retro_1996_bw": "bw", "retro_1996_sepia": "sepia",
    "retro_1996_vhs": "vhs", "retro_1996_grunge": "grunge",
    "photo_styles_retro_1996": "retro", "photo_styles_film_noir": "noir",
    "photo_styles_polaroid": "polaroid",
    # futuristic / cyber
    "futuristic_2026": "futuristic", "futuristic_2026_neon": "neon",
    "futuristic_2026_cyber": "cyberpunk", "futuristic_2026_glitch": "glitch",
    "futuristic_2026_ai_art": "futuristic", "photo_styles_future_2026": "futuristic",
    # anime
    "anime_style": "anime", "anime_style_manga": "anime",
    "anime_style_ghibli": "anime", "anime_style_chibi": "anime",
    "anime_style_cyberpunk": "cyberpunk",
    # occasions
    "birthday": "birthday_glam", "birthday_bday_queen": "birthday_glam",
    "birthday_bday_pink": "birthday_glam", "birthday_queen": "birthday_glam",
    "birthday_queen_crown": "birthday_glam", "birthday_queen_glam": "birthday_glam",
    "wedding_look": "wedding", "wedding_look_bride": "wedding",
    "wedding_look_groom": "wedding", "wedding_look_aisle": "wedding",
    "graduation": "graduation", "graduation_cap": "graduation",
    # kids
    "kids_cartoon": "kids_cartoon", "kids_superhero": "kids_cartoon",
    "kids_fairy_tale": "kids_cartoon", "kids_space": "futuristic",
    # age
    "age_filter_young": "age_younger", "age_filter_teen": "age_younger",
    "age_filter_old": "age_older", "age_filter_elder": "age_older",
    # fantasy / sports
    "fantasy_armor": "fantasy", "fantasy_armor_knight": "fantasy",
    "fantasy_armor_warrior": "fantasy", "fantasy_armor_elf": "fantasy",
    "stadium_cam": "stadium", "stadium_cam_football": "stadium",
    "horse_riding": "cinematic", "horse_riding_snow": "cinematic",
    "dance_video": "vivid", "dance_video_hiphop": "vivid",
    # portrait
    "ai_portrait": "portrait", "ai_portrait_studio": "portrait",
    "ai_portrait_linkedin": "portrait",
}

def _get_filter(studio_id: str, pose_id: str) -> str:
    key = f"{studio_id}_{pose_id}"
    return STYLE_MAP.get(key) or STYLE_MAP.get(studio_id) or "default"


# ── OpenCV colour-grading filters ────────────────────────────────────────────

def _make_lut(r_curve, g_curve, b_curve) -> np.ndarray:
    """Build a 256-entry LUT from three channel adjustment functions."""
    lut = np.zeros((256, 1, 3), dtype=np.uint8)
    for i in range(256):
        lut[i, 0, 0] = np.clip(b_curve(i), 0, 255)
        lut[i, 0, 1] = np.clip(g_curve(i), 0, 255)
        lut[i, 0, 2] = np.clip(r_curve(i), 0, 255)
    return lut


def apply_style_filter(img: np.ndarray, style: str) -> np.ndarray:
    """Apply a named colour-grade to a BGR image. Returns BGR."""
    if style == "bw":
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        out = cv2.cvtColor(g, cv2.COLOR_GRAY2BGR)
        return _apply_clahe(out)

    if style == "sepia":
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        sepia = np.zeros_like(img)
        sepia[:, :, 2] = np.clip(g * 1.08, 0, 255)   # R
        sepia[:, :, 1] = np.clip(g * 0.84, 0, 255)   # G
        sepia[:, :, 0] = np.clip(g * 0.65, 0, 255)   # B
        return sepia.astype(np.uint8)

    if style == "retro":
        # Faded film: lift blacks, warm tones, desaturate slightly
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
        lab[:, :, 0] = np.clip(lab[:, :, 0] * 0.88 + 18, 0, 255)   # lift blacks
        lab[:, :, 2] = np.clip(lab[:, :, 2] * 0.75, 0, 255)        # warm (reduce B)
        out = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
        # Add grain
        noise = np.random.randint(0, 18, out.shape, dtype=np.uint8)
        return cv2.add(out, noise)

    if style == "vhs":
        # VHS: low-contrast, cyan-red chromatic aberration, scanlines
        out = img.copy()
        b, g, r = cv2.split(out)
        r = np.clip(r.astype(np.int16) + 12, 0, 255).astype(np.uint8)
        b = np.clip(b.astype(np.int16) - 10, 0, 255).astype(np.uint8)
        out = cv2.merge([b, g, r])
        # scanlines
        for y in range(0, out.shape[0], 4):
            out[y] = (out[y] * 0.72).astype(np.uint8)
        return out

    if style == "grunge":
        # High contrast, desaturated, add texture noise
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        out = cv2.cvtColor(g, cv2.COLOR_GRAY2BGR)
        out = cv2.convertScaleAbs(out, alpha=1.4, beta=-20)
        noise = np.random.randint(0, 25, out.shape, dtype=np.uint8)
        return cv2.add(out, noise)

    if style == "noir":
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        out = cv2.cvtColor(g, cv2.COLOR_GRAY2BGR)
        out = cv2.convertScaleAbs(out, alpha=1.6, beta=-40)
        return _apply_vignette(out, strength=0.7)

    if style == "polaroid":
        out = cv2.convertScaleAbs(img, alpha=1.05, beta=10)
        # Warm lift
        b, g, r = cv2.split(out)
        r = np.clip(r.astype(np.int16) + 15, 0, 255).astype(np.uint8)
        b = np.clip(b.astype(np.int16) - 8, 0, 255).astype(np.uint8)
        return cv2.merge([b, g, r])

    if style == "futuristic":
        # Cool tones, high clarity, slight blue-green push
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
        lab[:, :, 0] = np.clip(lab[:, :, 0] * 1.08, 0, 255)
        lab[:, :, 1] = np.clip(lab[:, :, 1] * 0.80, 0, 255)  # desaturate red
        lab[:, :, 2] = np.clip(lab[:, :, 2] - 12, 0, 255)    # cooler
        out = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
        return _apply_clahe(out)

    if style == "neon":
        # High saturation, dark bg boost, vivid colours
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.6, 0, 255)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.1, 0, 255)
        out = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        return _apply_vignette(out, strength=0.55)

    if style == "cyberpunk":
        # Purple-cyan split toning
        b, g, r = cv2.split(img)
        r = np.clip(r.astype(np.int16) + 30, 0, 255).astype(np.uint8)
        b = np.clip(b.astype(np.int16) + 40, 0, 255).astype(np.uint8)
        g = np.clip(g.astype(np.int16) - 10, 0, 255).astype(np.uint8)
        out = cv2.merge([b, g, r])
        hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.4, 0, 255)
        return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    if style == "glitch":
        out = img.copy()
        h = out.shape[0]
        for _ in range(12):
            y = np.random.randint(0, h - 4)
            shift = np.random.randint(-14, 14)
            out[y:y+3] = np.roll(out[y:y+3], shift, axis=1)
        b, g, r = cv2.split(out)
        r = np.roll(r, 4, axis=1)
        b = np.roll(b, -4, axis=1)
        return cv2.merge([b, g, r])

    if style == "anime":
        # Edge-preserve smooth + saturate + slight outline
        smooth = cv2.bilateralFilter(img, 9, 75, 75)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                                      cv2.THRESH_BINARY, 9, 9)
        edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
        out = cv2.bitwise_and(smooth, edges_bgr)
        hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.5, 0, 255)
        return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    if style == "birthday_glam":
        # Warm, soft-glow, lifted highlights
        out = cv2.convertScaleAbs(img, alpha=1.08, beta=12)
        b, g, r = cv2.split(out)
        r = np.clip(r.astype(np.int16) + 20, 0, 255).astype(np.uint8)
        g = np.clip(g.astype(np.int16) + 8, 0, 255).astype(np.uint8)
        out = cv2.merge([b, g, r])
        return cv2.GaussianBlur(out, (0, 0), 0.6) * 0 + out  # no-op soften

    if style == "wedding":
        # Soft pastel, slightly desaturated, lifted whites
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
        lab[:, :, 0] = np.clip(lab[:, :, 0] * 1.06 + 8, 0, 255)
        lab[:, :, 1] = np.clip(lab[:, :, 1] * 0.65, 0, 255)
        lab[:, :, 2] = np.clip(lab[:, :, 2] * 0.65, 0, 255)
        return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)

    if style == "graduation":
        # Clean, bright, professional
        out = cv2.convertScaleAbs(img, alpha=1.12, beta=5)
        return _apply_clahe(out)

    if style == "age_older":
        # Reduce saturation, add fine wrinkle texture, slightly yellow
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
        lab[:, :, 1] = np.clip(lab[:, :, 1] * 0.70, 0, 255)
        lab[:, :, 2] = np.clip(lab[:, :, 2] * 0.85 + 6, 0, 255)  # slight yellow
        out = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
        noise = np.random.randint(0, 8, out.shape, dtype=np.uint8)
        return cv2.add(out, noise)

    if style == "age_younger":
        # Smooth skin, boost saturation, lift brightness
        smooth = cv2.bilateralFilter(img, 11, 80, 80)
        hsv = cv2.cvtColor(smooth, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.2, 0, 255)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.1, 0, 255)
        return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    if style == "kids_cartoon":
        smooth = cv2.bilateralFilter(img, 15, 80, 80)
        hsv = cv2.cvtColor(smooth, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.8, 0, 255)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.15, 0, 255)
        return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    if style == "fantasy":
        # Deep tones, warm shadows, cinematic
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
        lab[:, :, 0] = np.clip(lab[:, :, 0] * 0.92, 0, 255)
        lab[:, :, 1] = np.clip(lab[:, :, 1] * 0.85 + 4, 0, 255)
        lab[:, :, 2] = np.clip(lab[:, :, 2] * 1.10, 0, 255)  # warm
        out = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
        return _apply_vignette(out, strength=0.45)

    if style == "stadium":
        # High contrast, vivid, slightly cool
        out = cv2.convertScaleAbs(img, alpha=1.25, beta=-10)
        hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.3, 0, 255)
        return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    if style == "cinematic":
        out = cv2.convertScaleAbs(img, alpha=1.15, beta=-8)
        return _apply_vignette(out, strength=0.4)

    if style == "vivid":
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.45, 0, 255)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.08, 0, 255)
        return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    if style == "portrait":
        smooth = cv2.bilateralFilter(img, 7, 60, 60)
        return _apply_clahe(smooth)

    # default — CLAHE sharpening only
    return _apply_clahe(img)


def _apply_clahe(img: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return cv2.cvtColor(cv2.merge([clahe.apply(l), a, b]), cv2.COLOR_LAB2BGR)


def _apply_vignette(img: np.ndarray, strength: float = 0.5) -> np.ndarray:
    h, w = img.shape[:2]
    Y, X = np.ogrid[:h, :w]
    cx, cy = w / 2, h / 2
    mask = 1.0 - strength * ((X - cx) ** 2 / (cx ** 2) + (Y - cy) ** 2 / (cy ** 2)) / 2
    mask = np.clip(mask, 0, 1)[:, :, None]
    return np.clip(img * mask, 0, 255).astype(np.uint8)


# ── Prompt-to-image renderer ─────────────────────────────────────────────────

# Keyword → background colour palette for prompt-based generation
_PROMPT_PALETTES: list[tuple[list[str], tuple, tuple, tuple]] = [
    # keywords, bg_top, bg_bottom, accent
    (["wolf", "forest", "nature", "tree", "jungle"],
     (10, 35, 15), (5, 20, 8), (80, 200, 80)),
    (["ocean", "sea", "beach", "water", "wave"],
     (10, 30, 80), (5, 15, 50), (80, 180, 255)),
    (["space", "galaxy", "star", "cosmos", "nebula", "astronaut"],
     (5, 0, 20), (2, 0, 10), (150, 80, 255)),
    (["fire", "dragon", "volcano", "lava", "flame"],
     (60, 10, 0), (30, 5, 0), (255, 100, 20)),
    (["city", "urban", "neon", "cyberpunk", "night", "street"],
     (5, 5, 25), (0, 0, 10), (20, 180, 255)),
    (["sunset", "golden", "warm", "desert", "savannah"],
     (80, 40, 5), (40, 20, 0), (255, 180, 40)),
    (["snow", "winter", "ice", "arctic", "cold", "frost"],
     (180, 200, 220), (140, 160, 190), (200, 230, 255)),
    (["flower", "garden", "spring", "blossom", "pink"],
     (60, 10, 40), (40, 5, 25), (255, 120, 200)),
    (["portrait", "face", "person", "cinematic", "studio", "close"],
     (20, 15, 10), (10, 8, 5), (200, 160, 80)),
]

_DEFAULT_PALETTE = ((15, 10, 25), (5, 5, 15), (180, 140, 60))


def _pick_palette(prompt: str):
    p = prompt.lower()
    for keywords, top, bot, accent in _PROMPT_PALETTES:
        if any(k in p for k in keywords):
            return top, bot, accent
    return _DEFAULT_PALETTE


def _draw_gradient(img: np.ndarray, top: tuple, bot: tuple):
    h = img.shape[0]
    for y in range(h):
        t = y / h
        r = int(top[0] * (1 - t) + bot[0] * t)
        g = int(top[1] * (1 - t) + bot[1] * t)
        b = int(top[2] * (1 - t) + bot[2] * t)
        img[y, :] = [b, g, r]


def _draw_stars(img: np.ndarray, n: int = 120):
    h, w = img.shape[:2]
    for _ in range(n):
        x = np.random.randint(0, w)
        y = np.random.randint(0, h // 2)
        r = np.random.randint(160, 255)
        img[y, x] = [r, r, r]


def _draw_abstract_shape(img: np.ndarray, accent: tuple, prompt: str):
    """Draw prompt-themed abstract shape in the frame centre."""
    h, w = img.shape[:2]
    cx, cy = w // 2, h // 2
    p = prompt.lower()

    if any(k in p for k in ["moon", "circle", "portal", "planet"]):
        cv2.circle(img, (cx, cy - h // 10), min(w, h) // 5,
                   (accent[2], accent[1], accent[0]), -1)
        cv2.circle(img, (cx, cy - h // 10), min(w, h) // 5 + 3,
                   (255, 255, 255), 2)
    elif any(k in p for k in ["diamond", "gem", "crystal"]):
        pts = np.array([[cx, cy - 80], [cx + 55, cy],
                        [cx, cy + 80], [cx - 55, cy]], np.int32)
        cv2.fillPoly(img, [pts], (accent[2], accent[1], accent[0]))
    else:
        # Generic soft radial glow
        for radius in range(min(w, h) // 3, 0, -4):
            alpha = (1 - radius / (min(w, h) / 3)) * 0.06
            overlay = img.copy()
            cv2.circle(overlay, (cx, cy), radius,
                       (accent[2], accent[1], accent[0]), -1)
            img[:] = cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0)


def _render_prompt_text(img: np.ndarray, prompt: str, accent: tuple):
    """Render wrapped prompt text at the bottom of the image."""
    h, w = img.shape[:2]
    font = cv2.FONT_HERSHEY_SIMPLEX
    # Wrap text
    words = prompt.split()
    lines, line = [], []
    for word in words:
        test = " ".join(line + [word])
        if cv2.getTextSize(test, font, 0.55, 1)[0][0] > w - 40:
            if line:
                lines.append(" ".join(line))
            line = [word]
        else:
            line.append(word)
    if line:
        lines.append(" ".join(line))
    lines = lines[:4]  # max 4 lines

    y_base = h - 20 - len(lines) * 28
    for i, ln in enumerate(lines):
        y = y_base + i * 28
        # Shadow
        cv2.putText(img, ln, (21, y + 1), font, 0.55, (0, 0, 0), 2, cv2.LINE_AA)
        # Text
        cv2.putText(img, ln, (20, y), font, 0.55,
                    (accent[2], accent[1], accent[0]), 1, cv2.LINE_AA)


def generate_prompt_image(prompt: str, output_path: str, size=(512, 768)) -> Tuple[bool, Optional[str]]:
    """
    Synthesise a stylised image from a text prompt using OpenCV drawing.
    No ML model required — produces a visually coherent branded result.
    """
    try:
        w, h = size
        img = np.zeros((h, w, 3), dtype=np.uint8)
        p = prompt.lower()

        top, bot, accent = _pick_palette(prompt)
        _draw_gradient(img, top, bot)

        # Stars for dark/space scenes
        if any(k in p for k in ["space", "galaxy", "star", "night", "cosmos",
                                 "universe", "dark", "wolf", "moon"]):
            _draw_stars(img, 180)

        _draw_abstract_shape(img, accent, prompt)

        # Cinematic vignette
        img = _apply_vignette(img, strength=0.55)

        # Draw prompt text
        _render_prompt_text(img, prompt, accent)

        # "ANVA AI" watermark
        cv2.putText(img, "ANVA AI", (w - 90, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                    (accent[2], accent[1], accent[0]), 1, cv2.LINE_AA)

        # Add subtle noise for film feel
        noise = np.random.randint(0, 12, img.shape, dtype=np.uint8)
        img = cv2.add(img, noise)

        # Final polish
        img = _apply_clahe(img)

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(output_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return True, None
    except Exception as e:
        logger.error(f"Prompt-to-image error: {e}", exc_info=True)
        return False, str(e)


# ── Pose-photo downloader ─────────────────────────────────────────────────────

def _download_pose_photo(studio_id: str, pose_id: str) -> Optional[str]:
    key = f"{studio_id}_{pose_id}"
    cached = _CACHE_DIR / f"{key}.jpg"
    if cached.exists():
        return str(cached)
    url = POSE_PHOTO_URLS.get(key)
    if not url:
        # fallback: first matching studio
        for k, v in POSE_PHOTO_URLS.items():
            if k.startswith(studio_id + "_"):
                url = v
                break
    if not url:
        return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = resp.read()
        cached.write_bytes(data)
        logger.info(f"Cached pose photo: {key}")
        return str(cached)
    except Exception as e:
        logger.warning(f"Download failed {key}: {e}")
        return None


# ── Geometry helpers ──────────────────────────────────────────────────────────

_ARCFACE_DST = np.array([
    [38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366],
    [41.5493, 92.3655], [70.7299, 92.2041],
], dtype=np.float32)


def _estimate_norm(src_kps: np.ndarray, dst_kps: np.ndarray) -> np.ndarray:
    M, _ = cv2.estimateAffinePartial2D(src_kps, dst_kps, method=cv2.LMEDS)
    if M is None:
        tx = dst_kps[2, 0] - src_kps[2, 0]
        ty = dst_kps[2, 1] - src_kps[2, 1]
        M = np.array([[1, 0, tx], [0, 1, ty]], dtype=np.float64)
    return M


def _estimate_kps(cx: int, cy: int, half_w: int) -> np.ndarray:
    hw, hh = half_w, int(half_w * 1.1)
    return np.array([
        [cx - hw * 0.6, cy - hh * 0.15],
        [cx + hw * 0.6, cy - hh * 0.15],
        [cx,            cy + hh * 0.10],
        [cx - hw * 0.4, cy + hh * 0.55],
        [cx + hw * 0.4, cy + hh * 0.55],
    ], dtype=np.float32)


# ── Main ImageProcessor class ─────────────────────────────────────────────────

class ImageProcessor:
    def __init__(self):
        self._app = None
        self._swapper = None
        self._ready = False

    def initialize(self):
        try:
            from insightface.app import FaceAnalysis
            import insightface
            logger.info("Loading InsightFace buffalo_l …")
            self._app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
            self._app.prepare(ctx_id=0, det_size=(640, 640))
            swapper_path = Path("models/inswapper_128.onnx")
            if swapper_path.exists():
                self._swapper = insightface.model_zoo.get_model(
                    str(swapper_path), providers=["CPUExecutionProvider"]
                )
                logger.info("inswapper_128 loaded ✓")
            else:
                logger.warning("inswapper_128.onnx not found — blend pipeline only")
            self._ready = True
            logger.info("ImageProcessor ready ✓")
        except Exception as e:
            logger.warning(f"InsightFace init failed: {e}")

    # ── Async entry ──────────────────────────────────────────────────────────
    async def generate(
        self,
        source_image_path: str,
        template_image_path: str,
        output_path: str,
        gender: str = "auto",
        skin_tone: Optional[str] = None,
        style_prompt: Optional[str] = None,
        studio_id: str = "",
        pose_id: str = "",
    ) -> Tuple[bool, Optional[str]]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._generate_sync,
            source_image_path, template_image_path, output_path,
            studio_id, pose_id, style_prompt or "",
        )

    def _generate_sync(
        self,
        source_path: str,
        template_path: str,
        output_path: str,
        studio_id: str,
        pose_id: str,
        style_prompt: str,
    ) -> Tuple[bool, Optional[str]]:
        try:
            # Prompt-only generation (no source image)
            if studio_id == "custom_generator" or source_path == "prompt_only":
                return generate_prompt_image(style_prompt or "A cinematic portrait", output_path)

            target_path = _download_pose_photo(studio_id, pose_id) or template_path

            if studio_id in VIDEO_STUDIOS:
                mp4_out = output_path if output_path.endswith(".mp4") else output_path.replace(".jpg", ".mp4")
                return self._make_motion_video(source_path, target_path, mp4_out, studio_id, pose_id)
            else:
                return self._swap_image(source_path, target_path, output_path, studio_id, pose_id)
        except Exception as e:
            logger.error(f"Generation error: {e}", exc_info=True)
            return False, str(e)

    # ── Image swap + style filter ────────────────────────────────────────────
    def _swap_image(
        self, source_path: str, target_path: str, output_path: str,
        studio_id: str = "", pose_id: str = "",
    ) -> Tuple[bool, Optional[str]]:
        src = cv2.imread(source_path)
        tgt = cv2.imread(target_path)
        if src is None:
            return False, "Cannot read uploaded photo."
        if tgt is None:
            return False, "Cannot read target template."

        tgt = self._resize_canvas(tgt, 512, 768)

        if self._ready and self._swapper:
            ok, err = self._pipeline_inswapper(src, tgt, output_path)
        elif self._ready:
            ok, err = self._pipeline_precision_blend(src, tgt, output_path)
        else:
            ok, err = self._pipeline_haar_blend(src, tgt, output_path)

        # Apply style filter on top
        if ok:
            result = cv2.imread(output_path)
            if result is not None:
                style = _get_filter(studio_id, pose_id)
                styled = apply_style_filter(result, style)
                cv2.imwrite(output_path, styled, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return ok, err

    # ── Pipeline A: inswapper_128 ────────────────────────────────────────────
    def _pipeline_inswapper(self, src, tgt, output_path):
        src_faces = self._app.get(src)
        tgt_faces = self._app.get(tgt)
        if not src_faces:
            return False, "No face detected. Use a clear, front-facing selfie."
        if not tgt_faces:
            return self._pipeline_precision_blend(src, tgt, output_path)
        src_face = max(src_faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]))
        result = tgt.copy()
        for tgt_face in tgt_faces:
            result = self._swapper.get(result, tgt_face, src_face, paste_back=True)
        result = self._post_process(result)
        self._save(result, output_path)
        return True, None

    # ── Pipeline B: affine-warp + seamlessClone ──────────────────────────────
    def _pipeline_precision_blend(self, src, tgt, output_path):
        src_faces = self._app.get(src)
        tgt_faces = self._app.get(tgt)
        if not src_faces:
            return False, "No face detected. Use a clear, front-facing selfie."
        src_face = max(src_faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]))
        src_kps = src_face.kps.astype(np.float32)
        th, tw = tgt.shape[:2]
        if tgt_faces:
            tgt_face = max(tgt_faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]))
            tgt_kps = tgt_face.kps.astype(np.float32)
            bbox = tgt_face.bbox.astype(int)
            cx = int((bbox[0]+bbox[2])/2); cy = int((bbox[1]+bbox[3])/2)
            ax = int((bbox[2]-bbox[0])*0.54); ay = int((bbox[3]-bbox[1])*0.60)
        else:
            tgt_kps = _estimate_kps(tw//2, int(th*0.20), int(tw*0.20))
            cx, cy = tw//2, int(th*0.22); ax, ay = int(tw*0.20), int(th*0.24)
        M = _estimate_norm(src_kps, tgt_kps)
        warped = cv2.warpAffine(src, M, (tw, th), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        mask = np.zeros((th, tw), dtype=np.uint8)
        cv2.ellipse(mask, (cx, cy), (ax, ay), 0, 0, 360, 255, -1)
        ksize = max(31, (min(ax, ay)//4)|1)
        mask = cv2.GaussianBlur(mask, (ksize, ksize), 0)
        warped = self._color_transfer(warped, tgt, mask)
        try:
            result = cv2.seamlessClone(warped, tgt, mask, (cx, cy), cv2.NORMAL_CLONE)
        except Exception:
            mf = mask.astype(float)[:,:,None]/255.0
            result = np.clip(warped*mf + tgt*(1-mf), 0, 255).astype(np.uint8)
        result = self._post_process(result)
        self._save(result, output_path)
        return True, None

    # ── Pipeline C: Haar fallback ────────────────────────────────────────────
    def _pipeline_haar_blend(self, src, tgt, output_path):
        sd = self._haar_detect(src); td = self._haar_detect(tgt)
        if not sd["found"]:
            return False, "No face detected. Use a clear selfie."
        src_kps = _estimate_kps(sd["x"]+sd["w"]//2, sd["y"]+int(sd["h"]*0.2), int(sd["w"]*0.3))
        if td["found"]:
            tgt_kps = _estimate_kps(td["x"]+td["w"]//2, td["y"]+int(td["h"]*0.2), int(td["w"]*0.3))
            cx = td["x"]+td["w"]//2; cy = td["y"]+td["h"]//2
            ax = int(td["w"]*0.52); ay = int(td["h"]*0.58)
        else:
            th, tw = tgt.shape[:2]
            tgt_kps = _estimate_kps(tw//2, int(th*0.20), int(tw*0.20))
            cx, cy = tw//2, int(th*0.22); ax, ay = int(tw*0.20), int(th*0.24)
        M = _estimate_norm(src_kps, tgt_kps)
        th, tw = tgt.shape[:2]
        warped = cv2.warpAffine(src, M, (tw, th), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        mask = np.zeros((th, tw), dtype=np.uint8)
        cv2.ellipse(mask, (cx, cy), (ax, ay), 0, 0, 360, 255, -1)
        ksize = max(21, (min(ax,ay)//4)|1)
        mask = cv2.GaussianBlur(mask, (ksize, ksize), 0)
        warped = self._color_transfer(warped, tgt, mask)
        try:
            result = cv2.seamlessClone(warped, tgt, mask, (cx, cy), cv2.NORMAL_CLONE)
        except Exception:
            mf = mask.astype(float)[:,:,None]/255.0
            result = np.clip(warped*mf+tgt*(1-mf), 0, 255).astype(np.uint8)
        result = self._post_process(result)
        self._save(result, output_path)
        return True, None

    # ── Video generation ─────────────────────────────────────────────────────
    def _make_motion_video(self, source_path, target_path, output_path, studio_id, pose_id):
        """
        1. Face-swap onto target scene
        2. Apply style filter for studio
        3. Animate with Ken-Burns / dance / float effect
        4. Write MP4 (fallback to JPEG if cv2 codec unavailable)
        """
        jpg_path = output_path.replace(".mp4", "_frame.jpg")
        ok, err = self._swap_image(source_path, target_path, jpg_path, studio_id, pose_id)
        if not ok:
            return False, err

        frame = cv2.imread(jpg_path)
        if frame is None:
            return False, "Could not read generated frame"

        fh, fw = frame.shape[:2]
        fps, duration_sec = 24, 6
        n_frames = fps * duration_sec

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(output_path, fourcc, fps, (fw, fh))

        effect = self._pick_effect(studio_id, pose_id)
        for i in range(n_frames):
            t = i / max(n_frames - 1, 1)
            writer.write(self._apply_effect(frame, t, fw, fh, effect))
        writer.release()

        if not Path(output_path).exists() or Path(output_path).stat().st_size < 1024:
            logger.warning("Video write failed — saving JPEG instead")
            cv2.imwrite(output_path.replace(".mp4", ".jpg"), frame,
                        [cv2.IMWRITE_JPEG_QUALITY, 95])
        return True, None

    def _pick_effect(self, studio_id, pose_id):
        if studio_id in {"dance_video", "kids_cartoon", "kids_superhero"}:
            return "bounce"
        if studio_id in {"kids_space", "kids_fairy_tale", "kids_underwater"}:
            return "float"
        if studio_id in {"ai_videos", "horse_riding", "fantasy_armor"}:
            return "zoom"
        return "ken_burns"

    def _apply_effect(self, frame, t, fw, fh, effect):
        if effect == "zoom":
            return self._zoom_frame(frame, 1.0 + 0.12 * t, fw, fh)
        elif effect == "ken_burns":
            return self._zoom_pan_frame(frame, 1.0 + 0.10 * t,
                                        int(fw * 0.04 * t), 0, fw, fh)
        elif effect == "bounce":
            scale = 1.0 + 0.04 * abs(np.sin(t * np.pi * 4))
            return self._zoom_frame(frame, scale, fw, fh)
        elif effect == "float":
            dy = int(fh * 0.015 * np.sin(t * np.pi * 2))
            M = np.float32([[1, 0, 0], [0, 1, dy]])
            return cv2.warpAffine(frame, M, (fw, fh), borderMode=cv2.BORDER_REFLECT)
        return frame.copy()

    def _zoom_frame(self, frame, scale, fw, fh):
        M = cv2.getRotationMatrix2D((fw/2, fh/2), 0, scale)
        return cv2.warpAffine(frame, M, (fw, fh), flags=cv2.INTER_LINEAR,
                              borderMode=cv2.BORDER_REFLECT)

    def _zoom_pan_frame(self, frame, scale, tx, ty, fw, fh):
        M = cv2.getRotationMatrix2D((fw/2, fh/2), 0, scale)
        M[0, 2] += tx; M[1, 2] += ty
        return cv2.warpAffine(frame, M, (fw, fh), flags=cv2.INTER_LINEAR,
                              borderMode=cv2.BORDER_REFLECT)

    # ── Shared helpers ───────────────────────────────────────────────────────
    def _haar_detect(self, img):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = cascade.detectMultiScale(gray, scaleFactor=1.05,
                                         minNeighbors=4, minSize=(40, 40))
        if len(faces) > 0:
            x, y, w, h = max(faces, key=lambda f: f[2]*f[3])
            return {"found": True, "x":int(x), "y":int(y), "w":int(w), "h":int(h)}
        return {"found": False}

    def _color_transfer(self, src, tgt, mask):
        try:
            s = cv2.cvtColor(src, cv2.COLOR_BGR2LAB).astype(np.float32)
            t = cv2.cvtColor(tgt, cv2.COLOR_BGR2LAB).astype(np.float32)
            m = mask.astype(bool)
            for ch in range(3):
                sp = s[:,:,ch][m]; tp = t[:,:,ch][m]
                if sp.std() < 1e-3: continue
                s[:,:,ch][m] = (sp-sp.mean())*(tp.std()/(sp.std()+1e-6))+tp.mean()
            return cv2.cvtColor(np.clip(s,0,255).astype(np.uint8), cv2.COLOR_LAB2BGR)
        except Exception:
            return src

    def _post_process(self, img):
        blur = cv2.GaussianBlur(img, (0,0), 1.5)
        sharp = cv2.addWeighted(img, 1.3, blur, -0.3, 0)
        return _apply_clahe(sharp)

    def _resize_canvas(self, img, w, h):
        ih, iw = img.shape[:2]
        scale = max(w/iw, h/ih)
        nw, nh = int(iw*scale), int(ih*scale)
        resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LANCZOS4)
        y0, x0 = (nh-h)//2, (nw-w)//2
        cropped = resized[y0:y0+h, x0:x0+w]
        if cropped.shape[0] != h or cropped.shape[1] != w:
            cropped = cv2.resize(cropped, (w, h), interpolation=cv2.INTER_LANCZOS4)
        return cropped

    def _save(self, img, output_path):
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(output_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])


# Singleton
image_processor = ImageProcessor()
