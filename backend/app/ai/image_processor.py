"""
Production AI pipeline — proper face mapping with InsightFace.

Pipeline:
  1. buffalo_l RetinaFace  — detects faces + 5-point landmarks in both images
  2. inswapper_128.onnx    — swaps source identity onto target face precisely
  3. seamlessClone         — Poisson blend for invisible edges
  4. CLAHE + unsharp mask  — final polish
  5. Kids/cartoon mode     — pre-warp source face to match cartoon face region
"""
import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Tuple
import logging
import asyncio
import urllib.request

logger = logging.getLogger(__name__)

# ── Target photo URLs keyed by studio_id_pose_id ──────────────────────────────
POSE_PHOTO_URLS: dict[str, str] = {
    # ── face_swap ────────────────────────────────────────────────────────────
    "face_swap_photo":       "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "face_swap_celeb":       "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "face_swap_movie":       "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "face_swap_cartoon":     "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=512&h=768&fit=crop&q=90",
    # ── ai_portrait ──────────────────────────────────────────────────────────
    "ai_portrait_studio":    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "ai_portrait_outdoor":   "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "ai_portrait_linkedin":  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=512&h=768&fit=crop&q=90",
    "ai_portrait_creative":  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&q=90",
    # ── photo_styles ─────────────────────────────────────────────────────────
    "photo_styles_retro_1996":   "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "photo_styles_future_2026":  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "photo_styles_film_noir":    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "photo_styles_polaroid":     "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    # ── anime_style ──────────────────────────────────────────────────────────
    "anime_style_manga":         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "anime_style_ghibli":        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "anime_style_chibi":         "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=512&h=768&fit=crop&q=90",
    "anime_style_cyberpunk":     "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    # ── birthday ─────────────────────────────────────────────────────────────
    "birthday_bday_queen":       "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "birthday_bday_pink":        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    "birthday_bday_candles":     "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "birthday_bday_outdoor":     "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&q=90",
    # ── stadium_cam ──────────────────────────────────────────────────────────
    "stadium_cam_football":      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "stadium_cam_concert":       "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "stadium_cam_basketball":    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "stadium_cam_fan_zone":      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    # ── horse_riding (video) ─────────────────────────────────────────────────
    "horse_riding_snow":         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "horse_riding_beach":        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "horse_riding_forest":       "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "horse_riding_meadow":       "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&q=90",
    # ── fantasy_armor ────────────────────────────────────────────────────────
    "fantasy_armor_knight":      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "fantasy_armor_warrior":     "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "fantasy_armor_elf":         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "fantasy_armor_mage":        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    # ── dance_video (video) ──────────────────────────────────────────────────
    "dance_video_hiphop":        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "dance_video_salsa":         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "dance_video_kpop":          "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "dance_video_viral":         "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    # ── talking_photo (video) ────────────────────────────────────────────────
    "talking_photo_natural":     "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "talking_photo_laugh":       "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    "talking_photo_sing":        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "talking_photo_wink":        "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&q=90",
    # ── retro_1996 / futuristic_2026 ─────────────────────────────────────────
    "retro_1996_bw":             "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "retro_1996_sepia":          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    "retro_1996_vhs":            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "retro_1996_grunge":         "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "futuristic_2026_neon":      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "futuristic_2026_cyber":     "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "futuristic_2026_ai_art":    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&q=90",
    "futuristic_2026_glitch":    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    # ── wedding / graduation / birthday_queen ────────────────────────────────
    "wedding_look_bride":        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "wedding_look_groom":        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "wedding_look_couple":       "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "wedding_look_aisle":        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    "graduation_cap":            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "graduation_outdoor":        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "graduation_party":          "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&q=90",
    "graduation_formal":         "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "birthday_queen_crown":      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "birthday_queen_floral":     "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    "birthday_queen_glam":       "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "birthday_queen_casual":     "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=512&h=768&fit=crop&q=90",
    # ── outfit_tryon ─────────────────────────────────────────────────────────
    "outfit_tryon_casual":       "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "outfit_tryon_formal":       "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=512&h=768&fit=crop&q=90",
    "outfit_tryon_sport":        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "outfit_tryon_party":        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    # ── age_filter ───────────────────────────────────────────────────────────
    "age_filter_young":          "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=512&h=768&fit=crop&q=90",
    "age_filter_old":            "https://images.unsplash.com/photo-1601576084861-5de423553c0f?w=512&h=768&fit=crop&q=90",
    "age_filter_teen":           "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=512&h=768&fit=crop&q=90",
    "age_filter_elder":          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    # ── kids (video) ─────────────────────────────────────────────────────────
    "kids_cartoon_superhero":    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "kids_cartoon_anime":        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "kids_cartoon_fairy":        "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=512&h=768&fit=crop&q=90",
    "kids_superhero_marvel":     "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "kids_superhero_dc":         "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    "kids_fairy_tale_princess":  "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=512&h=768&fit=crop&q=90",
    "kids_fairy_tale_knight":    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "kids_space_astronaut":      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "kids_space_alien":          "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "kids_dinosaur_trex":        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "kids_underwater_mermaid":   "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    # ── ai_videos (video) ────────────────────────────────────────────────────
    "ai_videos_collage":         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768&fit=crop&q=90",
    "ai_videos_cinematic":       "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768&fit=crop&q=90",
    "ai_videos_fantasy":         "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=512&h=768&fit=crop&q=90",
    "ai_videos_dance":           "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
}

# Studios that produce video output — must match frontend VIDEO_STUDIOS set
VIDEO_STUDIOS = {
    "ai_videos", "dance_video", "talking_photo",
    "horse_riding", "kids_cartoon", "kids_superhero",
    "kids_fairy_tale", "kids_space", "kids_dinosaur", "kids_underwater",
}

_CACHE_DIR = Path("pose_templates/cached_photos")
_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _download_pose_photo(studio_id: str, pose_id: str) -> Optional[str]:
    key = f"{studio_id}_{pose_id}"
    cached = _CACHE_DIR / f"{key}.jpg"
    if cached.exists():
        return str(cached)
    url = POSE_PHOTO_URLS.get(key)
    if not url:
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


# Standard 5-point landmark template (112x112 arcface space)
_ARCFACE_DST = np.array([
    [38.2946, 51.6963],
    [73.5318, 51.5014],
    [56.0252, 71.7366],
    [41.5493, 92.3655],
    [70.7299, 92.2041],
], dtype=np.float32)


def _estimate_norm(src_kps: np.ndarray, dst_kps: np.ndarray) -> np.ndarray:
    """
    Compute affine matrix that maps src_kps → dst_kps using least-squares.
    Returns 2x3 affine matrix.
    """
    assert src_kps.shape == (5, 2) and dst_kps.shape == (5, 2)
    M, _ = cv2.estimateAffinePartial2D(
        src_kps, dst_kps, method=cv2.LMEDS
    )
    if M is None:
        # fallback: simple translation
        tx = dst_kps[2, 0] - src_kps[2, 0]
        ty = dst_kps[2, 1] - src_kps[2, 1]
        M = np.array([[1, 0, tx], [0, 1, ty]], dtype=np.float64)
    return M


def _estimate_kps(cx: int, cy: int, half_w: int) -> np.ndarray:
    """Synthesize 5 face keypoints from center + width estimate."""
    hw = half_w
    hh = int(half_w * 1.1)
    return np.array([
        [cx - hw * 0.6, cy - hh * 0.15],   # left eye
        [cx + hw * 0.6, cy - hh * 0.15],   # right eye
        [cx,            cy + hh * 0.10],   # nose
        [cx - hw * 0.4, cy + hh * 0.55],   # left mouth
        [cx + hw * 0.4, cy + hh * 0.55],   # right mouth
    ], dtype=np.float32)


class ImageProcessor:
    def __init__(self):
        self._app = None       # InsightFace FaceAnalysis (buffalo_l)
        self._swapper = None   # inswapper_128.onnx
        self._ready = False

    # ── Startup init ──────────────────────────────────────────────────────────
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
                logger.warning("inswapper_128.onnx not found — precision blend only")

            self._ready = True
            logger.info("ImageProcessor ready ✓")
        except Exception as e:
            logger.warning(f"InsightFace init failed: {e}")

    # ── Public async entry ────────────────────────────────────────────────────
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

    # ── Dispatcher ────────────────────────────────────────────────────────────
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
            target_path = _download_pose_photo(studio_id, pose_id) or template_path

            if studio_id in VIDEO_STUDIOS:
                mp4_path = output_path.replace(".jpg", ".mp4")
                return self._make_motion_video(source_path, target_path, mp4_path, studio_id, pose_id)
            else:
                return self._swap_image(source_path, target_path, output_path)
        except Exception as e:
            logger.error(f"Generation error: {e}", exc_info=True)
            return False, str(e)

    # ── Core image face swap ──────────────────────────────────────────────────
    def _swap_image(
        self, source_path: str, target_path: str, output_path: str
    ) -> Tuple[bool, Optional[str]]:
        src = cv2.imread(source_path)
        tgt = cv2.imread(target_path)
        if src is None:
            return False, "Cannot read your uploaded photo."
        if tgt is None:
            return False, "Cannot read target template."

        tgt = self._resize_canvas(tgt, 512, 768)

        if self._ready and self._swapper:
            return self._pipeline_inswapper(src, tgt, output_path)
        elif self._ready:
            return self._pipeline_precision_blend(src, tgt, output_path)
        else:
            return self._pipeline_haar_blend(src, tgt, output_path)

    # ── Pipeline A: inswapper_128 (best quality) ──────────────────────────────
    def _pipeline_inswapper(
        self, src: np.ndarray, tgt: np.ndarray, output_path: str
    ) -> Tuple[bool, Optional[str]]:
        src_faces = self._app.get(src)
        tgt_faces = self._app.get(tgt)

        if not src_faces:
            return False, "No face detected. Use a clear, front-facing, well-lit selfie."
        if not tgt_faces:
            logger.warning("No face in target — falling back to precision blend")
            return self._pipeline_precision_blend(src, tgt, output_path)

        # Use the largest detected face from source
        src_face = max(src_faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))

        result = tgt.copy()
        for tgt_face in tgt_faces:
            result = self._swapper.get(result, tgt_face, src_face, paste_back=True)

        result = self._post_process(result)
        self._save(result, output_path)
        return True, None

    # ── Pipeline B: affine-warp + seamlessClone (no swapper model) ────────────
    def _pipeline_precision_blend(
        self, src: np.ndarray, tgt: np.ndarray, output_path: str
    ) -> Tuple[bool, Optional[str]]:
        src_faces = self._app.get(src)
        tgt_faces = self._app.get(tgt)

        if not src_faces:
            return False, "No face detected. Use a clear, front-facing selfie."

        src_face = max(src_faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
        src_kps = src_face.kps.astype(np.float32)

        th, tw = tgt.shape[:2]
        if tgt_faces:
            tgt_face = max(tgt_faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
            tgt_kps = tgt_face.kps.astype(np.float32)
            bbox = tgt_face.bbox.astype(int)
            cx = int((bbox[0] + bbox[2]) / 2)
            cy = int((bbox[1] + bbox[3]) / 2)
            ax = int((bbox[2] - bbox[0]) * 0.54)
            ay = int((bbox[3] - bbox[1]) * 0.60)
        else:
            tgt_kps = _estimate_kps(tw // 2, int(th * 0.20), int(tw * 0.20))
            cx, cy = tw // 2, int(th * 0.22)
            ax, ay = int(tw * 0.20), int(th * 0.24)

        # Affine-warp source onto target face region
        M = _estimate_norm(src_kps, tgt_kps)
        warped = cv2.warpAffine(src, M, (tw, th), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)

        # Precise elliptical mask
        mask = np.zeros((th, tw), dtype=np.uint8)
        cv2.ellipse(mask, (cx, cy), (ax, ay), 0, 0, 360, 255, -1)
        ksize = max(31, (min(ax, ay) // 4) | 1)
        mask = cv2.GaussianBlur(mask, (ksize, ksize), 0)

        warped = self._color_transfer(warped, tgt, mask)

        # Seamless Poisson clone
        try:
            result = cv2.seamlessClone(warped, tgt, mask, (cx, cy), cv2.NORMAL_CLONE)
        except Exception:
            mf = mask.astype(float)[:, :, None] / 255.0
            result = np.clip(warped * mf + tgt * (1 - mf), 0, 255).astype(np.uint8)

        result = self._post_process(result)
        self._save(result, output_path)
        return True, None

    # ── Pipeline C: Haar cascade fallback ────────────────────────────────────
    def _pipeline_haar_blend(
        self, src: np.ndarray, tgt: np.ndarray, output_path: str
    ) -> Tuple[bool, Optional[str]]:
        sd = self._haar_detect(src)
        td = self._haar_detect(tgt)
        if not sd["found"]:
            return False, "No face detected. Use a clear selfie."

        src_kps = _estimate_kps(sd["x"] + sd["w"]//2, sd["y"] + int(sd["h"]*0.2), int(sd["w"]*0.3))
        if td["found"]:
            tgt_kps = _estimate_kps(td["x"] + td["w"]//2, td["y"] + int(td["h"]*0.2), int(td["w"]*0.3))
            cx = td["x"] + td["w"] // 2
            cy = td["y"] + td["h"] // 2
            ax = int(td["w"] * 0.52)
            ay = int(td["h"] * 0.58)
        else:
            th, tw = tgt.shape[:2]
            tgt_kps = _estimate_kps(tw//2, int(th*0.20), int(tw*0.20))
            cx, cy = tw//2, int(th*0.22)
            ax, ay = int(tw*0.20), int(th*0.24)

        M = _estimate_norm(src_kps, tgt_kps)
        th, tw = tgt.shape[:2]
        warped = cv2.warpAffine(src, M, (tw, th), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)

        mask = np.zeros((th, tw), dtype=np.uint8)
        cv2.ellipse(mask, (cx, cy), (ax, ay), 0, 0, 360, 255, -1)
        ksize = max(21, (min(ax, ay) // 4) | 1)
        mask = cv2.GaussianBlur(mask, (ksize, ksize), 0)

        warped = self._color_transfer(warped, tgt, mask)
        try:
            result = cv2.seamlessClone(warped, tgt, mask, (cx, cy), cv2.NORMAL_CLONE)
        except Exception:
            mf = mask.astype(float)[:, :, None] / 255.0
            result = np.clip(warped * mf + tgt * (1 - mf), 0, 255).astype(np.uint8)

        result = self._post_process(result)
        self._save(result, output_path)
        return True, None

    # ── Motion video (Ken Burns + morph) ─────────────────────────────────────
    def _make_motion_video(
        self,
        source_path: str,
        target_path: str,
        output_path: str,
        studio_id: str,
        pose_id: str,
    ) -> Tuple[bool, Optional[str]]:
        """
        Generate a short MP4 with the user's face swapped onto the target image,
        then animated with a smooth Ken Burns zoom/pan or morph effect.
        Falls back to saving a JPEG if video writing fails.
        """
        # First do the face swap to get the result image
        jpg_path = output_path.replace(".mp4", "_frame.jpg")
        ok, err = self._swap_image(source_path, target_path, jpg_path)
        if not ok:
            return False, err

        frame = cv2.imread(jpg_path)
        if frame is None:
            return False, "Could not read generated frame"

        fh, fw = frame.shape[:2]
        fps = 24
        duration_sec = 5
        n_frames = fps * duration_sec

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        # Try writing MP4
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(output_path, fourcc, fps, (fw, fh))

        effect = self._pick_effect(studio_id, pose_id)

        for i in range(n_frames):
            t = i / (n_frames - 1)   # 0.0 → 1.0
            out_frame = self._apply_effect(frame, t, fw, fh, effect)
            writer.write(out_frame)

        writer.release()

        # Verify file was written; if empty fallback to JPEG
        if not Path(output_path).exists() or Path(output_path).stat().st_size < 1024:
            logger.warning("Video write failed — saving JPEG instead")
            output_path_jpg = output_path.replace(".mp4", ".jpg")
            cv2.imwrite(output_path_jpg, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
            return True, None

        return True, None

    def _pick_effect(self, studio_id: str, pose_id: str) -> str:
        """Choose an animation effect based on the studio."""
        dance_ids = {"dance_video", "kids_cartoon", "kids_superhero"}
        zoom_ids  = {"ai_videos", "stadium_cam", "horse_riding", "fantasy_armor"}
        float_ids = {"kids_space", "kids_fairy_tale", "kids_underwater"}
        if studio_id in dance_ids:
            return "bounce"
        if studio_id in float_ids:
            return "float"
        if studio_id in zoom_ids:
            return "zoom"
        return "ken_burns"

    def _apply_effect(
        self, frame: np.ndarray, t: float, fw: int, fh: int, effect: str
    ) -> np.ndarray:
        """Apply a single animation frame at progress t (0→1)."""
        if effect == "zoom":
            # Gentle zoom in 1.0 → 1.12
            scale = 1.0 + 0.12 * t
            return self._zoom_frame(frame, scale, fw, fh)

        elif effect == "ken_burns":
            # Zoom + subtle pan right-to-left
            scale = 1.0 + 0.10 * t
            pan_x = int(fw * 0.04 * t)
            return self._zoom_pan_frame(frame, scale, pan_x, 0, fw, fh)

        elif effect == "bounce":
            # Slight scale pulse for dance feel
            scale = 1.0 + 0.04 * abs(np.sin(t * np.pi * 4))
            return self._zoom_frame(frame, scale, fw, fh)

        elif effect == "float":
            # Gentle vertical float up then down
            dy = int(fh * 0.015 * np.sin(t * np.pi * 2))
            M = np.float32([[1, 0, 0], [0, 1, dy]])
            return cv2.warpAffine(frame, M, (fw, fh), borderMode=cv2.BORDER_REFLECT)

        return frame.copy()

    def _zoom_frame(self, frame: np.ndarray, scale: float, fw: int, fh: int) -> np.ndarray:
        cx, cy = fw / 2, fh / 2
        M = cv2.getRotationMatrix2D((cx, cy), 0, scale)
        return cv2.warpAffine(frame, M, (fw, fh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    def _zoom_pan_frame(
        self, frame: np.ndarray, scale: float, tx: int, ty: int, fw: int, fh: int
    ) -> np.ndarray:
        cx, cy = fw / 2, fh / 2
        M = cv2.getRotationMatrix2D((cx, cy), 0, scale)
        M[0, 2] += tx
        M[1, 2] += ty
        return cv2.warpAffine(frame, M, (fw, fh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    # ── Helpers ───────────────────────────────────────────────────────────────
    def _haar_detect(self, img: np.ndarray) -> dict:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=4, minSize=(40, 40))
        if len(faces) > 0:
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
            return {"found": True, "x": int(x), "y": int(y), "w": int(w), "h": int(h)}
        return {"found": False}

    def _color_transfer(
        self, src: np.ndarray, tgt: np.ndarray, mask: np.ndarray
    ) -> np.ndarray:
        """Match src color stats to tgt within the mask region (LAB space)."""
        try:
            s = cv2.cvtColor(src, cv2.COLOR_BGR2LAB).astype(np.float32)
            t = cv2.cvtColor(tgt, cv2.COLOR_BGR2LAB).astype(np.float32)
            m = mask.astype(bool)
            for ch in range(3):
                sp = s[:, :, ch][m]
                tp = t[:, :, ch][m]
                if sp.std() < 1e-3:
                    continue
                s[:, :, ch][m] = (sp - sp.mean()) * (tp.std() / (sp.std() + 1e-6)) + tp.mean()
            return cv2.cvtColor(np.clip(s, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)
        except Exception:
            return src

    def _post_process(self, img: np.ndarray) -> np.ndarray:
        """Unsharp mask + CLAHE on L channel."""
        # Unsharp mask
        blur = cv2.GaussianBlur(img, (0, 0), 1.5)
        sharp = cv2.addWeighted(img, 1.3, blur, -0.3, 0)
        # CLAHE
        lab = cv2.cvtColor(sharp, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
        l = clahe.apply(l)
        return cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)

    def _resize_canvas(self, img: np.ndarray, w: int, h: int) -> np.ndarray:
        """Resize image to fit w×h keeping aspect ratio, black-pad remainder."""
        ih, iw = img.shape[:2]
        scale = min(w / iw, h / ih)
        nw, nh = int(iw * scale), int(ih * scale)
        resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LANCZOS4)
        canvas = np.zeros((h, w, 3), dtype=np.uint8)
        y0 = (h - nh) // 2
        x0 = (w - nw) // 2
        canvas[y0:y0+nh, x0:x0+nw] = resized
        return canvas

    def _save(self, img: np.ndarray, output_path: str) -> None:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(output_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])


# Singleton
image_processor = ImageProcessor()
