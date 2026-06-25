"""
Face detection module using MediaPipe and OpenCV.
Detects face landmarks, bounding box, and estimates skin tone.
"""
import cv2
import numpy as np
from typing import Optional, Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)


class FaceDetector:
    """
    Lightweight face detector using OpenCV + MediaPipe.
    Falls back to Haar cascades if MediaPipe is unavailable.
    """

    def __init__(self):
        self._mp_face = None
        self._haar_cascade = None
        self._initialized = False

    def _init_mediapipe(self):
        try:
            import mediapipe as mp
            mp_face_detection = mp.solutions.face_detection
            self._mp_face = mp_face_detection.FaceDetection(
                model_selection=1,  # full range model
                min_detection_confidence=0.5,
            )
            logger.info("MediaPipe face detection loaded")
            return True
        except Exception as e:
            logger.warning(f"MediaPipe unavailable: {e}")
            return False

    def _init_haar(self):
        try:
            self._haar_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            )
            logger.info("Haar cascade face detection loaded")
            return True
        except Exception as e:
            logger.warning(f"Haar cascade unavailable: {e}")
            return False

    def initialize(self):
        if not self._init_mediapipe():
            self._init_haar()
        self._initialized = True

    def detect(self, image_path: str) -> Dict[str, Any]:
        """
        Detect face in image and return metadata.
        Returns dict with: detected (bool), bbox, landmarks, skin_tone, confidence
        """
        if not self._initialized:
            self.initialize()

        try:
            img = cv2.imread(image_path)
            if img is None:
                return {"detected": False, "error": "Cannot read image"}

            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            h, w = img.shape[:2]

            result = {"detected": False, "bbox": None, "confidence": 0.0, "skin_tone": None}

            # Try MediaPipe first
            if self._mp_face is not None:
                detection_result = self._mp_face.process(img_rgb)
                if detection_result.detections:
                    det = detection_result.detections[0]
                    bbox = det.location_data.relative_bounding_box
                    x = int(bbox.xmin * w)
                    y = int(bbox.ymin * h)
                    bw = int(bbox.width * w)
                    bh = int(bbox.height * h)

                    # Clamp
                    x, y = max(0, x), max(0, y)
                    x2, y2 = min(w, x + bw), min(h, y + bh)

                    result["detected"] = True
                    result["bbox"] = {"x": x, "y": y, "w": x2 - x, "h": y2 - y}
                    result["confidence"] = det.score[0] if det.score else 0.9

                    # Estimate skin tone from face region
                    face_region = img_rgb[y:y2, x:x2]
                    result["skin_tone"] = self._estimate_skin_tone(face_region)

            # Fallback to Haar cascade
            elif self._haar_cascade is not None:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = self._haar_cascade.detectMultiScale(gray, 1.1, 4, minSize=(30, 30))
                if len(faces) > 0:
                    x, y, fw, fh = faces[0]
                    result["detected"] = True
                    result["bbox"] = {"x": int(x), "y": int(y), "w": int(fw), "h": int(fh)}
                    result["confidence"] = 0.85

                    face_region = img_rgb[y:y+fh, x:x+fw]
                    result["skin_tone"] = self._estimate_skin_tone(face_region)

            return result

        except Exception as e:
            logger.error(f"Face detection error: {e}")
            return {"detected": False, "error": str(e)}

    def _estimate_skin_tone(self, face_region: np.ndarray) -> str:
        """Classify skin tone into rough categories using average pixel values."""
        if face_region.size == 0:
            return "medium"
        avg = face_region.mean(axis=(0, 1))  # RGB averages
        r, g, b = avg[0], avg[1], avg[2]
        brightness = 0.299 * r + 0.587 * g + 0.114 * b

        if brightness > 200:
            return "fair"
        elif brightness > 160:
            return "light"
        elif brightness > 120:
            return "medium"
        elif brightness > 80:
            return "tan"
        elif brightness > 50:
            return "brown"
        else:
            return "dark"

    def extract_face(
        self,
        image_path: str,
        padding: float = 0.3,
    ) -> Optional[np.ndarray]:
        """Extract face crop with padding as numpy array."""
        detection = self.detect(image_path)
        if not detection["detected"]:
            return None

        img = cv2.imread(image_path)
        h, w = img.shape[:2]
        bbox = detection["bbox"]

        pad_x = int(bbox["w"] * padding)
        pad_y = int(bbox["h"] * padding)

        x1 = max(0, bbox["x"] - pad_x)
        y1 = max(0, bbox["y"] - pad_y)
        x2 = min(w, bbox["x"] + bbox["w"] + pad_x)
        y2 = min(h, bbox["y"] + bbox["h"] + pad_y)

        return img[y1:y2, x1:x2]


# Singleton
face_detector = FaceDetector()
