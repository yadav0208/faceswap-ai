"""
Pose template generator — creates synthetic pose templates using
PIL drawing. Used when no template images are provided.
"""
import os
import math
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
from typing import Tuple
import logging

logger = logging.getLogger(__name__)

# Color palettes for different style categories
STYLE_PALETTES = {
    "fashion": {
        "bg": [(240, 232, 220), (220, 210, 195), (200, 190, 175)],
        "clothing": [(30, 30, 30), (60, 20, 80), (180, 50, 50)],
        "accent": [(212, 175, 55), (192, 160, 45)],
    },
    "casual": {
        "bg": [(230, 240, 255), (220, 235, 250), (200, 220, 245)],
        "clothing": [(70, 100, 180), (50, 80, 160), (90, 120, 200)],
        "accent": [(255, 255, 255), (240, 240, 255)],
    },
    "formal": {
        "bg": [(245, 245, 245), (235, 235, 235), (220, 220, 220)],
        "clothing": [(20, 20, 20), (40, 40, 60), (30, 30, 30)],
        "accent": [(180, 150, 100), (200, 170, 120)],
    },
    "sports": {
        "bg": [(200, 240, 200), (180, 225, 180), (160, 210, 160)],
        "clothing": [(20, 100, 200), (200, 50, 50), (40, 160, 40)],
        "accent": [(255, 200, 0), (255, 220, 50)],
    },
    "beach": {
        "bg": [(135, 206, 235), (100, 180, 220), (80, 160, 200)],
        "clothing": [(255, 165, 0), (255, 140, 0), (230, 120, 0)],
        "accent": [(255, 255, 200), (255, 250, 180)],
    },
    "party": {
        "bg": [(50, 0, 80), (40, 0, 60), (60, 0, 100)],
        "clothing": [(180, 0, 120), (200, 0, 140), (160, 0, 100)],
        "accent": [(255, 215, 0), (255, 200, 0)],
    },
}

POSES = {
    "standing_front": {
        "description": "Standing straight, arms relaxed",
        "keypoints": {
            "head": (0.5, 0.12), "neck": (0.5, 0.22),
            "l_shoulder": (0.38, 0.28), "r_shoulder": (0.62, 0.28),
            "l_elbow": (0.33, 0.42), "r_elbow": (0.67, 0.42),
            "l_wrist": (0.30, 0.55), "r_wrist": (0.70, 0.55),
            "l_hip": (0.43, 0.55), "r_hip": (0.57, 0.55),
            "l_knee": (0.43, 0.72), "r_knee": (0.57, 0.72),
            "l_ankle": (0.43, 0.88), "r_ankle": (0.57, 0.88),
        },
    },
    "power_pose": {
        "description": "Confident stance, hands on hips",
        "keypoints": {
            "head": (0.5, 0.11), "neck": (0.5, 0.21),
            "l_shoulder": (0.36, 0.27), "r_shoulder": (0.64, 0.27),
            "l_elbow": (0.28, 0.38), "r_elbow": (0.72, 0.38),
            "l_wrist": (0.32, 0.50), "r_wrist": (0.68, 0.50),
            "l_hip": (0.42, 0.54), "r_hip": (0.58, 0.54),
            "l_knee": (0.41, 0.72), "r_knee": (0.59, 0.72),
            "l_ankle": (0.41, 0.89), "r_ankle": (0.59, 0.89),
        },
    },
    "crossed_arms": {
        "description": "Arms crossed, powerful look",
        "keypoints": {
            "head": (0.5, 0.11), "neck": (0.5, 0.21),
            "l_shoulder": (0.37, 0.27), "r_shoulder": (0.63, 0.27),
            "l_elbow": (0.55, 0.36), "r_elbow": (0.45, 0.36),
            "l_wrist": (0.62, 0.42), "r_wrist": (0.38, 0.42),
            "l_hip": (0.43, 0.54), "r_hip": (0.57, 0.54),
            "l_knee": (0.43, 0.71), "r_knee": (0.57, 0.71),
            "l_ankle": (0.43, 0.88), "r_ankle": (0.57, 0.88),
        },
    },
    "walking": {
        "description": "Dynamic walking pose",
        "keypoints": {
            "head": (0.5, 0.11), "neck": (0.5, 0.21),
            "l_shoulder": (0.38, 0.27), "r_shoulder": (0.62, 0.27),
            "l_elbow": (0.45, 0.40), "r_elbow": (0.58, 0.38),
            "l_wrist": (0.50, 0.52), "r_wrist": (0.63, 0.48),
            "l_hip": (0.44, 0.54), "r_hip": (0.56, 0.54),
            "l_knee": (0.38, 0.70), "r_knee": (0.57, 0.69),
            "l_ankle": (0.35, 0.87), "r_ankle": (0.58, 0.86),
        },
    },
    "hand_on_chin": {
        "description": "Thoughtful pose, hand on chin",
        "keypoints": {
            "head": (0.5, 0.11), "neck": (0.5, 0.21),
            "l_shoulder": (0.37, 0.27), "r_shoulder": (0.63, 0.27),
            "l_elbow": (0.32, 0.41), "r_elbow": (0.55, 0.35),
            "l_wrist": (0.28, 0.54), "r_wrist": (0.50, 0.22),
            "l_hip": (0.43, 0.54), "r_hip": (0.57, 0.54),
            "l_knee": (0.43, 0.72), "r_knee": (0.57, 0.72),
            "l_ankle": (0.43, 0.88), "r_ankle": (0.57, 0.88),
        },
    },
    "side_profile": {
        "description": "Elegant side profile",
        "keypoints": {
            "head": (0.55, 0.11), "neck": (0.53, 0.21),
            "l_shoulder": (0.45, 0.27), "r_shoulder": (0.60, 0.27),
            "l_elbow": (0.40, 0.42), "r_elbow": (0.58, 0.40),
            "l_wrist": (0.37, 0.55), "r_wrist": (0.56, 0.53),
            "l_hip": (0.47, 0.54), "r_hip": (0.55, 0.54),
            "l_knee": (0.46, 0.72), "r_knee": (0.55, 0.71),
            "l_ankle": (0.45, 0.88), "r_ankle": (0.54, 0.87),
        },
    },
}


def _draw_gradient_bg(draw: ImageDraw.Draw, w: int, h: int, colors: list):
    """Draw a vertical gradient background."""
    top, bottom = colors[0], colors[-1]
    for y in range(h):
        t = y / h
        r = int(top[0] * (1 - t) + bottom[0] * t)
        g = int(top[1] * (1 - t) + bottom[1] * t)
        b = int(top[2] * (1 - t) + bottom[2] * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))


def _px(rel: float, dim: int) -> int:
    return int(rel * dim)


def _draw_body(
    draw: ImageDraw.Draw,
    kp: dict,
    w: int,
    h: int,
    skin: Tuple,
    clothing: Tuple,
    accent: Tuple,
):
    """Draw stylized figure body."""

    def P(name):
        k = kp[name]
        return (_px(k[0], w), _px(k[1], h))

    lw_body = max(8, w // 40)
    lw_limb = max(6, w // 55)

    # Torso
    torso_pts = [P("l_shoulder"), P("r_shoulder"), P("r_hip"), P("l_hip")]
    draw.polygon(torso_pts, fill=clothing)

    # Arms
    for side in [("l_shoulder", "l_elbow", "l_wrist"), ("r_shoulder", "r_elbow", "r_wrist")]:
        pts = [P(s) for s in side]
        for i in range(len(pts) - 1):
            draw.line([pts[i], pts[i + 1]], fill=skin, width=lw_limb)
        draw.ellipse(
            [pts[-1][0] - lw_limb, pts[-1][1] - lw_limb,
             pts[-1][0] + lw_limb, pts[-1][1] + lw_limb],
            fill=skin,
        )

    # Legs
    for side in [("l_hip", "l_knee", "l_ankle"), ("r_hip", "r_knee", "r_ankle")]:
        pts = [P(s) for s in side]
        for i in range(len(pts) - 1):
            draw.line([pts[i], pts[i + 1]], fill=clothing, width=lw_body)
        # Shoes
        ax, ay = pts[-1]
        draw.ellipse([ax - lw_body, ay - 4, ax + lw_body * 1.5, ay + 8], fill=accent)

    # Neck
    neck = P("neck")
    head = P("head")
    draw.line([neck, head], fill=skin, width=lw_limb)

    # Head (circle)
    head_r = max(20, w // 18)
    hx, hy = head
    draw.ellipse([hx - head_r, hy - head_r, hx + head_r, hy + head_r], fill=skin)

    # Simple face features
    eye_r = max(2, head_r // 6)
    eye_y = hy - head_r // 5
    draw.ellipse([hx - head_r // 3 - eye_r, eye_y - eye_r,
                  hx - head_r // 3 + eye_r, eye_y + eye_r], fill=(50, 30, 20))
    draw.ellipse([hx + head_r // 3 - eye_r, eye_y - eye_r,
                  hx + head_r // 3 + eye_r, eye_y + eye_r], fill=(50, 30, 20))

    # Smile
    smile_box = [hx - head_r // 3, hy + head_r // 8,
                 hx + head_r // 3, hy + head_r // 2]
    draw.arc(smile_box, start=0, end=180, fill=(180, 80, 80), width=2)


def generate_pose_template(
    pose_name: str,
    category: str,
    output_path: str,
    size: Tuple[int, int] = (400, 600),
) -> bool:
    """Generate a stylized pose template image."""
    try:
        w, h = size
        img = Image.new("RGB", (w, h), (255, 255, 255))
        draw = ImageDraw.Draw(img)

        palette = STYLE_PALETTES.get(category, STYLE_PALETTES["casual"])
        bg_colors = palette["bg"]
        clothing_color = palette["clothing"][0]
        accent_color = palette["accent"][0]
        skin_color = (220, 185, 150)  # neutral skin tone

        _draw_gradient_bg(draw, w, h, bg_colors)

        pose = POSES.get(pose_name, POSES["standing_front"])
        _draw_body(draw, pose["keypoints"], w, h, skin_color, clothing_color, accent_color)

        # Subtle vignette
        vignette = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        vd = ImageDraw.Draw(vignette)
        for i in range(min(w, h) // 3):
            alpha = int(60 * i / (min(w, h) // 3))
            vd.rectangle([i, i, w - i, h - i], outline=(0, 0, 0, alpha))
        img = Image.alpha_composite(img.convert("RGBA"), vignette).convert("RGB")

        # Slight blur for soft look
        img = img.filter(ImageFilter.GaussianBlur(radius=0.5))

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        img.save(output_path, quality=95)
        return True

    except Exception as e:
        logger.error(f"Failed to generate pose template {pose_name}: {e}")
        return False


def generate_thumbnail(input_path: str, output_path: str, size: Tuple[int, int] = (150, 200)) -> bool:
    """Create thumbnail from template image."""
    try:
        img = Image.open(input_path)
        img.thumbnail(size, Image.LANCZOS)
        # Pad to exact size
        thumb = Image.new("RGB", size, (240, 240, 240))
        offset = ((size[0] - img.width) // 2, (size[1] - img.height) // 2)
        thumb.paste(img, offset)
        thumb.save(output_path, quality=85)
        return True
    except Exception as e:
        logger.error(f"Thumbnail generation failed: {e}")
        return False
