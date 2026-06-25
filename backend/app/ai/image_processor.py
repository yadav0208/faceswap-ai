"""
Core image processing pipeline.

AI Model used: InsightFace (inswapper_128) — the same model used by
professional face-swap apps. It is free, open-source, and runs on CPU.

Pipeline per request:
  1. Load user's uploaded face photo
  2. Load the target pose image (real person photo for the chosen style)
  3. Detect faces in both using RetinaFace (part of InsightFace)
  4. Swap user's face onto the target body using inswapper_128
  5. Post-process: color correction + sharpening
  6. Save result

Fallback (when InsightFace not installed):
  OpenCV Haar cascade face detection + elliptical alpha-blend compositing
"""
import cv2
import numpy as np
from PIL import Image, ImageFilter
from pathlib import Path
from typing import Optional, Tuple
import logging
import asyncio
import os
import urllib.request
import tempfile

logger = logging.getLogger(__name__)

# ─── Real person pose images (Unsplash, free) ─────────────────────────────────
# Keyed by studio_id + pose_id, mapping to a real photo URL
POSE_PHOTO_URLS: dict[str, str] = {
    # Fitness
    "fitness_gym_power": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=512&h=768&fit=crop&q=90",
    "fitness_gym_lean":  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=512&h=768&fit=crop&q=90",
    "fitness_gym_run":   "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=512&h=768&fit=crop&q=90",
    "fitness_gym_yoga":  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=512&h=768&fit=crop&q=90",
    # Outfit
    "outfit_out_stand":  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=512&h=768&fit=crop&q=90",
    "outfit_out_walk":   "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=512&h=768&fit=crop&q=90",
    "outfit_out_sit":    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=512&h=768&fit=crop&q=90",
    "outfit_out_pose":   "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?w=512&h=768&fit=crop&q=90",
    # Hairstyle
    "hairstyle_hair_front": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=512&h=768&fit=crop&q=90",
    "hairstyle_hair_side":  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=512&h=768&fit=crop&q=90",
    # Makeup
    "makeup_mk_glam":    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=512&h=768&fit=crop&q=90",
    "makeup_mk_natural": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=512&h=768&fit=crop&q=90",
    "makeup_mk_bold":    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=512&h=768&fit=crop&q=90",
    "makeup_mk_smokey":  "https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=512&h=768&fit=crop&q=90",
    # Professional
    "professional_pro_stand": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=512&h=768&fit=crop&q=90",
    "professional_pro_desk":  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=512&h=768&fit=crop&q=90",
    "professional_pro_conf":  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=512&h=768&fit=crop&q=90",
    "professional_pro_arms":  "https://images.unsplash.com/photo-1580894742597-87bc8789db3d?w=512&h=768&fit=crop&q=90",
    # Travel
    "travel_tr_street": "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=512&h=768&fit=crop&q=90",
    "travel_tr_beach":  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=512&h=768&fit=crop&q=90",
    "travel_tr_mtn":    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=512&h=768&fit=crop&q=90",
    "travel_tr_city":   "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=512&h=768&fit=crop&q=90",
    # Wedding
    "wedding_wed_stand": "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=512&h=768&fit=crop&q=90",
    "wedding_wed_walk":  "https://images.unsplash.com/photo-1519741497674-611481863552?w=512&h=768&fit=crop&q=90",
    # Avatar
    "avatar_av_cyber": "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=512&h=768&fit=crop&q=90",
    "avatar_av_neon":  "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=512&h=768&fit=crop&q=90",
}

_CACHE_DIR = Path("pose_templates/cached_photos")
_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _download_pose_photo(studio_id: str, pose_id: str) -> Optional[str]:
    """Download the target pose photo if not cached, return local path."""
    key = f"{studio_id}_{pose_id}"
    cached = _CACHE_DIR / f"{key}.jpg"
    if cached.exists():
        return str(cached)

    url = POSE_PHOTO_URLS.get(key)
    if not url:
        # Fallback: use first matching studio
        for k, v in POSE_PHOTO_URLS.items():
            if k.startswith(studio_id):
                url = v
                break
    if not url:
        return None

    try:
        logger.info(f"Downloading pose photo: {key}")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        with open(str(cached), "wb") as f:
            f.write(data)
        logger.info(f"Cached: {cached}")
        return str(cached)
    except Exception as e:
        logger.warning(f"Could not download pose photo {key}: {e}")
        return None


class ImageProcessor:
    def __init__(self):
        self._insightface_app = None
        self._swapper = None
        self._insightface_ready = False

    # ─── InsightFace init ────────────────────────────────────────────────────

    def initialize(self):
        self._load_insightface()

    def _load_insightface(self):
        try:
            from insightface.app import FaceAnalysis
            import insightface

            logger.info("Loading InsightFace (RetinaFace detector)...")
            app = FaceAnalysis(
                name="buffalo_sc",  # lightweight model, no internet needed after first download
                providers=["CPUExecutionProvider"],
            )
            app.prepare(ctx_id=0, det_size=(640, 640))
            self._insightface_app = app

            # Load inswapper model
            swapper_path = Path("models/inswapper_128.onnx")
            if swapper_path.exists():
                self._swapper = insightface.model_zoo.get_model(
                    str(swapper_path), providers=["CPUExecutionProvider"]
                )
                logger.info("inswapper_128 model loaded ✓")
            else:
                logger.warning(
                    "inswapper_128.onnx not found at models/inswapper_128.onnx — "
                    "face swap will use OpenCV blending. "
                    "Download from: https://github.com/deepinsight/insightface/releases"
                )

            self._insightface_ready = True
            logger.info("InsightFace ready ✓")
        except ImportError:
            logger.warning("insightface not installed — using OpenCV compositing fallback")
        except Exception as e:
            logger.warning(f"InsightFace init failed: {e} — using OpenCV fallback")

    # ─── Main entry point ────────────────────────────────────────────────────

    async def generate(
        self,
        source_image_path: str,
        template_image_path: str,   # kept for signature compat, may be overridden
        output_path: str,
        gender: str = "auto",
        skin_tone: Optional[str] = None,
        style_prompt: Optional[str] = None,
        studio_id: str = "",
        pose_id: str = "",
    ) -> Tuple[bool, Optional[str]]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._generate_sync,
            source_image_path,
            template_image_path,
            output_path,
            studio_id,
            pose_id,
        )

    def _generate_sync(
        self,
        source_path: str,
        template_path: str,
        output_path: str,
        studio_id: str,
        pose_id: str,
    ) -> Tuple[bool, Optional[str]]:
        try:
            # 1. Get real target pose photo
            target_path = _download_pose_photo(studio_id, pose_id)
            if not target_path:
                target_path = template_path  # fallback to DB template

            # 2. Choose pipeline
            if self._insightface_ready and self._swapper:
                return self._swap_insightface(source_path, target_path, output_path)
            elif self._insightface_ready:
                # Detector only, no swapper model — use landmark-guided blend
                return self._blend_with_landmarks(source_path, target_path, output_path)
            else:
                return self._opencv_composite(source_path, target_path, output_path)
        except Exception as e:
            logger.error(f"Generation error: {e}", exc_info=True)
            return False, str(e)

    # ─── Pipeline A: InsightFace full swap (best quality) ────────────────────

    def _swap_insightface(
        self, source_path: str, target_path: str, output_path: str
    ) -> Tuple[bool, Optional[str]]:
        source_img = cv2.imread(source_path)
        target_img = cv2.imread(target_path)

        if source_img is None:
            return False, "Cannot read source image"
        if target_img is None:
            return False, "Cannot read target image"

        # Resize target to consistent size
        target_img = self._resize_keep_aspect(target_img, 512, 768)

        src_faces = self._insightface_app.get(source_img)
        tgt_faces = self._insightface_app.get(target_img)

        if not src_faces:
            return False, "No face detected in your uploaded photo. Please use a clear, well-lit face photo."
        if not tgt_faces:
            logger.warning("No face in target — falling back to OpenCV composite")
            return self._opencv_composite(source_path, target_path, output_path)

        result = target_img.copy()
        for tgt_face in tgt_faces:
            result = self._swapper.get(result, tgt_face, src_faces[0], paste_back=True)

        result = self._post_process(result)
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(output_path, result, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return True, None

    # ─── Pipeline B: InsightFace detect + OpenCV blend ───────────────────────

    def _blend_with_landmarks(
        self, source_path: str, target_path: str, output_path: str
    ) -> Tuple[bool, Optional[str]]:
        source_img = cv2.imread(source_path)
        target_img = cv2.imread(target_path)

        if source_img is None or target_img is None:
            return False, "Cannot read image"

        target_img = self._resize_keep_aspect(target_img, 512, 768)

        src_faces = self._insightface_app.get(source_img)
        tgt_faces = self._insightface_app.get(target_img)

        if not src_faces:
            return False, "No face detected in your uploaded photo."

        # Use bounding boxes from InsightFace for better accuracy
        sf = src_faces[0]
        src_bbox = sf.bbox.astype(int)  # [x1,y1,x2,y2]

        src_data = {
            "found": True,
            "x": src_bbox[0], "y": src_bbox[1],
            "w": src_bbox[2] - src_bbox[0],
            "h": src_bbox[3] - src_bbox[1],
        }

        if tgt_faces:
            tf = tgt_faces[0]
            tgt_bbox = tf.bbox.astype(int)
            tgt_data = {
                "found": True,
                "x": tgt_bbox[0], "y": tgt_bbox[1],
                "w": tgt_bbox[2] - tgt_bbox[0],
                "h": tgt_bbox[3] - tgt_bbox[1],
            }
        else:
            tgt_data = {"found": False}

        result = self._do_face_blend(source_img, target_img, src_data, tgt_data)
        result = self._post_process(result)
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(output_path, result, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return True, None

    # ─── Pipeline C: Pure OpenCV (no InsightFace) ────────────────────────────

    def _opencv_composite(
        self, source_path: str, target_path: str, output_path: str
    ) -> Tuple[bool, Optional[str]]:
        source = cv2.imread(source_path)
        target = cv2.imread(target_path)

        if source is None:
            return False, "Cannot read source image"
        if target is None:
            return False, "Cannot read target image"

        target = self._resize_keep_aspect(target, 512, 768)

        src_data = self._haar_detect(source)
        tgt_data = self._haar_detect(target)

        if not src_data["found"]:
            return False, "No face detected in your uploaded photo. Please use a clear, well-lit selfie."

        result = self._do_face_blend(source, target, src_data, tgt_data)
        result = self._post_process(result)
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(output_path, result, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return True, None

    # ─── Face blending core ──────────────────────────────────────────────────

    def _do_face_blend(
        self,
        source: np.ndarray,
        target: np.ndarray,
        src_data: dict,
        tgt_data: dict,
    ) -> np.ndarray:
        sh, sw = source.shape[:2]
        th, tw = target.shape[:2]

        pad = 0.4
        # Source face crop
        sx1 = max(0, int(src_data["x"] - src_data["w"] * pad))
        sy1 = max(0, int(src_data["y"] - src_data["h"] * pad * 1.6))
        sx2 = min(sw, int(src_data["x"] + src_data["w"] * (1 + pad)))
        sy2 = min(sh, int(src_data["y"] + src_data["h"] * (1 + pad * 0.4)))
        face_crop = source[sy1:sy2, sx1:sx2]

        if tgt_data.get("found"):
            tx1 = max(0, int(tgt_data["x"] - tgt_data["w"] * pad))
            ty1 = max(0, int(tgt_data["y"] - tgt_data["h"] * pad * 1.6))
            tx2 = min(tw, int(tgt_data["x"] + tgt_data["w"] * (1 + pad)))
            ty2 = min(th, int(tgt_data["y"] + tgt_data["h"] * (1 + pad * 0.4)))
        else:
            # No face in target — put face in upper center
            face_size = int(tw * 0.4)
            tx1 = (tw - face_size) // 2
            ty1 = int(th * 0.04)
            tx2 = tx1 + face_size
            ty2 = ty1 + int(face_size * 1.3)
            ty2 = min(ty2, th)

        tw_region = tx2 - tx1
        th_region = ty2 - ty1

        if tw_region <= 0 or th_region <= 0 or face_crop.size == 0:
            return target

        face_resized = cv2.resize(face_crop, (tw_region, th_region))
        result = target.copy()

        # Color transfer: match skin tone to target lighting
        target_region = result[ty1:ty2, tx1:tx2]
        face_resized = self._color_transfer(face_resized, target_region)

        # Smooth elliptical mask
        mask = np.zeros((th_region, tw_region), dtype=np.uint8)
        cx, cy = tw_region // 2, th_region // 2
        ax = int(tw_region * 0.46)
        ay = int(th_region * 0.50)
        cv2.ellipse(mask, (cx, cy), (ax, ay), 0, 0, 360, 255, -1)
        blur_k = max(21, (min(tw_region, th_region) // 6) | 1)  # must be odd
        mask = cv2.GaussianBlur(mask, (blur_k, blur_k), 0)
        mask_f = mask.astype(float)[:, :, None] / 255.0

        blended = (face_resized.astype(float) * mask_f +
                   target_region.astype(float) * (1 - mask_f))
        result[ty1:ty2, tx1:tx2] = np.clip(blended, 0, 255).astype(np.uint8)
        return result

    # ─── Helpers ─────────────────────────────────────────────────────────────

    def _haar_detect(self, img: np.ndarray) -> dict:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        faces = cascade.detectMultiScale(
            gray, scaleFactor=1.05, minNeighbors=4, minSize=(30, 30)
        )
        if len(faces) > 0:
            x, y, w, h = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
            return {"found": True, "x": int(x), "y": int(y), "w": int(w), "h": int(h)}
        return {"found": False}

    def _color_transfer(self, src: np.ndarray, tgt: np.ndarray) -> np.ndarray:
        """Match color distribution of src to tgt in LAB space."""
        try:
            s = cv2.cvtColor(src, cv2.COLOR_BGR2LAB).astype(float)
            t = cv2.cvtColor(tgt, cv2.COLOR_BGR2LAB).astype(float)
            for ch in range(3):
                sm, ss = s[:, :, ch].mean(), s[:, :, ch].std() + 1e-6
                tm, ts = t[:, :, ch].mean(), t[:, :, ch].std() + 1e-6
                s[:, :, ch] = (s[:, :, ch] - sm) * (ts / ss) + tm
            return cv2.cvtColor(np.clip(s, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)
        except Exception:
            return src

    def _resize_keep_aspect(self, img: np.ndarray, w: int, h: int) -> np.ndarray:
        ih, iw = img.shape[:2]
        scale = min(w / iw, h / ih)
        nw, nh = int(iw * scale), int(ih * scale)
        resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LANCZOS4)
        canvas = np.zeros((h, w, 3), dtype=np.uint8)
        y0 = (h - nh) // 2
        x0 = (w - nw) // 2
        canvas[y0:y0+nh, x0:x0+nw] = resized
        return canvas

    def _post_process(self, img: np.ndarray) -> np.ndarray:
        # Unsharp mask
        blur = cv2.GaussianBlur(img, (0, 0), 2.0)
        result = cv2.addWeighted(img, 1.4, blur, -0.4, 0)
        # CLAHE on L channel
        lab = cv2.cvtColor(result, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        return cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)


image_processor = ImageProcessor()
