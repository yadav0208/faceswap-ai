"""
Face detection — uses InsightFace buffalo_l (same model as the swap pipeline).
Falls back to a permissive pass-through so uploads are never wrongly rejected.
"""
import cv2
import numpy as np
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class FaceDetector:
    def __init__(self):
        self._app = None
        self._initialized = False

    def initialize(self):
        if self._initialized:
            return
        try:
            from insightface.app import FaceAnalysis
            self._app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
            self._app.prepare(ctx_id=0, det_size=(640, 640))
            logger.info("FaceDetector: InsightFace buffalo_l ready")
        except Exception as e:
            logger.warning(f"FaceDetector: InsightFace unavailable ({e}) — using permissive mode")
            self._app = None
        self._initialized = True

    def detect(self, image_path: str) -> Dict[str, Any]:
        """
        Detect face in uploaded image.
        Returns dict with 'detected' bool and optional metadata.
        Never raises — on any error returns detected=True so the upload
        isn't wrongly rejected (the swap pipeline will catch bad images).
        """
        if not self._initialized:
            self.initialize()

        try:
            img = cv2.imread(image_path)
            if img is None:
                return {"detected": False, "error": "Cannot read image file"}

            # ── InsightFace detection (best accuracy) ──────────────────────
            if self._app is not None:
                faces = self._app.get(img)
                if faces:
                    face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
                    bbox = face.bbox.astype(int)
                    return {
                        "detected": True,
                        "confidence": float(face.det_score) if hasattr(face, "det_score") else 0.9,
                        "bbox": {
                            "x": int(bbox[0]), "y": int(bbox[1]),
                            "w": int(bbox[2] - bbox[0]), "h": int(bbox[3] - bbox[1]),
                        },
                        "skin_tone": self._estimate_skin_tone(img, bbox),
                    }
                else:
                    # InsightFace ran but found nothing — image likely has no clear face
                    logger.info(f"No face detected by InsightFace in {image_path}")
                    return {"detected": False, "confidence": 0.0}

            # ── Permissive fallback (InsightFace not available) ────────────
            # Let the upload through; swap pipeline will handle it
            logger.warning("FaceDetector running in permissive mode — skipping gate check")
            return {"detected": True, "confidence": 0.5, "bbox": None}

        except Exception as e:
            logger.error(f"Face detection error: {e} — passing through")
            # Don't block uploads on unexpected errors
            return {"detected": True, "confidence": 0.5, "error": str(e)}

    def _estimate_skin_tone(self, img: np.ndarray, bbox) -> str:
        try:
            x1, y1, x2, y2 = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])
            x1, y1 = max(0, x1), max(0, y1)
            region = img[y1:y2, x1:x2]
            if region.size == 0:
                return "medium"
            rgb = cv2.cvtColor(region, cv2.COLOR_BGR2RGB)
            avg = rgb.mean(axis=(0, 1))
            brightness = 0.299 * avg[0] + 0.587 * avg[1] + 0.114 * avg[2]
            if brightness > 200: return "fair"
            elif brightness > 160: return "light"
            elif brightness > 120: return "medium"
            elif brightness > 80:  return "tan"
            elif brightness > 50:  return "brown"
            else: return "dark"
        except Exception:
            return "medium"

    def extract_face(self, image_path: str, padding: float = 0.3) -> Optional[np.ndarray]:
        result = self.detect(image_path)
        if not result.get("detected") or not result.get("bbox"):
            return None
        img = cv2.imread(image_path)
        if img is None:
            return None
        h, w = img.shape[:2]
        b = result["bbox"]
        pad_x = int(b["w"] * padding)
        pad_y = int(b["h"] * padding)
        x1 = max(0, b["x"] - pad_x)
        y1 = max(0, b["y"] - pad_y)
        x2 = min(w, b["x"] + b["w"] + pad_x)
        y2 = min(h, b["y"] + b["h"] + pad_y)
        return img[y1:y2, x1:x2]


# Singleton
face_detector = FaceDetector()
