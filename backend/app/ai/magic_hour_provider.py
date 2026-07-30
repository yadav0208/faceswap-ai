"""Managed, licensed face-swap provider backed by Magic Hour."""
from __future__ import annotations

import logging
import shutil
import tempfile
from pathlib import Path
from typing import Optional, Tuple

from app.config import settings

logger = logging.getLogger(__name__)


class MagicHourProvider:
    @property
    def configured(self) -> bool:
        return bool(settings.MAGIC_HOUR_API_KEY)

    def swap_photo(
        self,
        source_path: str,
        target_path: str,
        output_path: str,
    ) -> Tuple[bool, Optional[str]]:
        if not self.configured:
            return False, "Magic Hour API key is not configured."
        try:
            from magic_hour import Client

            client = Client(
                token=settings.MAGIC_HOUR_API_KEY,
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
            )
            with tempfile.TemporaryDirectory(prefix="anva-face-swap-") as temp_dir:
                result = client.v1.face_swap_photo.generate(
                    assets={
                        "face_swap_mode": "all-faces",
                        "source_file_path": source_path,
                        "target_file_path": target_path,
                    },
                    name="Anva template face swap",
                    wait_for_completion=True,
                    download_outputs=True,
                    download_directory=temp_dir,
                )
                paths = getattr(result, "downloaded_paths", None) or []
                status = getattr(result, "status", None)
                if status != "complete" or not paths:
                    message = getattr(result, "error", None) or "Provider returned no image."
                    return False, f"Magic Hour face swap failed: {message}"
                Path(output_path).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(paths[0], output_path)
            return True, None
        except Exception as exc:
            logger.warning("Magic Hour face swap failed: %s", exc)
            return False, f"Magic Hour face swap failed: {exc}"

    def generate_image(
        self,
        prompt: str,
        output_path: str,
        aspect_ratio: str = "1:1",
    ) -> Tuple[bool, Optional[str]]:
        if not self.configured:
            return False, (
                "AI generation is not configured. Add your free MAGIC_HOUR_API_KEY "
                "to backend/.env."
            )
        try:
            from magic_hour import Client

            client = Client(
                token=settings.MAGIC_HOUR_API_KEY,
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
            )
            with tempfile.TemporaryDirectory(prefix="anva-image-") as temp_dir:
                result = client.v1.ai_image_generator.generate(
                    image_count=1,
                    aspect_ratio=aspect_ratio,
                    model=settings.MAGIC_HOUR_IMAGE_MODEL,
                    style={"prompt": prompt, "tool": "general"},
                    name="Anva prompt image",
                    wait_for_completion=True,
                    download_outputs=True,
                    download_directory=temp_dir,
                )
                paths = getattr(result, "downloaded_paths", None) or []
                status = getattr(result, "status", None)
                if status != "complete" or not paths:
                    message = getattr(result, "error", None) or str(getattr(result, "result", None) or "Provider returned no image.")
                    return False, f"Magic Hour image generation failed: {message}"
                Path(output_path).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(paths[0], output_path)
            return True, None
        except Exception as exc:
            logger.warning("Magic Hour image generation failed: %s", exc, exc_info=True)
            return False, f"Magic Hour image generation failed: {exc}"

    def talking_photo(
        self, image_path: str, audio_path: str, output_path: str,
        duration_seconds: float = 15.0,
    ) -> Tuple[bool, Optional[str]]:
        if not self.configured:
            return False, "Magic Hour API key is not configured."
        try:
            from magic_hour import Client
            client = Client(
                token=settings.MAGIC_HOUR_API_KEY,
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
            )
            with tempfile.TemporaryDirectory(prefix="anva-talking-photo-") as temp_dir:
                result = client.v1.ai_talking_photo.generate(
                    assets={
                        "image_file_path": image_path,
                        "audio_file_path": audio_path,
                    },
                    start_seconds=0.0,
                    end_seconds=max(0.1, min(duration_seconds, 60.0)),
                    name="Anva AI Talking Photo",
                    wait_for_completion=True,
                    download_outputs=True,
                    download_directory=temp_dir,
                )
                return self._copy_video_result(result, output_path, "Talking Photo")
        except Exception as exc:
            logger.warning("Magic Hour talking photo failed: %s", exc, exc_info=True)
            return False, f"Magic Hour talking photo failed: {exc}"

    def image_to_video(
        self, image_path: str, motion_prompt: str, output_path: str,
        duration_seconds: float = 5.0,
    ) -> Tuple[bool, Optional[str]]:
        if not self.configured:
            return False, "Magic Hour API key is not configured."
        try:
            from magic_hour import Client
            client = Client(
                token=settings.MAGIC_HOUR_API_KEY,
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
            )
            with tempfile.TemporaryDirectory(prefix="anva-motion-") as temp_dir:
                result = client.v1.image_to_video.generate(
                    assets={"image_file_path": image_path},
                    style={"prompt": motion_prompt},
                    end_seconds=max(1.0, min(duration_seconds, 10.0)),
                    # 480p is available on the current Magic Hour plan.
                    resolution="480p",
                    audio=True,
                    name="Anva Motion Template",
                    wait_for_completion=True,
                    download_outputs=True,
                    download_directory=temp_dir,
                )
                return self._copy_video_result(result, output_path, "Image to Video")
        except Exception as exc:
            logger.warning("Magic Hour image-to-video failed: %s", exc, exc_info=True)
            return False, f"Magic Hour image-to-video failed: {exc}"

    def generate_voice(
        self, prompt: str, voice_name: str, output_path: str,
    ) -> Tuple[bool, Optional[str]]:
        """Generate speech audio that can be passed directly to Talking Photo."""
        if not self.configured:
            return False, "Magic Hour API key is not configured."
        try:
            from magic_hour import Client
            client = Client(
                token=settings.MAGIC_HOUR_API_KEY,
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
            )
            with tempfile.TemporaryDirectory(prefix="anva-voice-") as temp_dir:
                result = client.v1.ai_voice_generator.generate(
                    style={"prompt": prompt, "voice_name": voice_name},
                    name="Anva Talking Photo Voice",
                    wait_for_completion=True,
                    download_outputs=True,
                    download_directory=temp_dir,
                )
                paths = getattr(result, "downloaded_paths", None) or []
                status = getattr(result, "status", None)
                if status != "complete" or not paths:
                    message = (
                        getattr(result, "error_message", None)
                        or getattr(result, "error", None)
                        or "Provider returned no audio."
                    )
                    return False, f"Magic Hour voice generation failed: {message}"
                Path(output_path).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(paths[0], output_path)
                return True, None
        except Exception as exc:
            logger.warning("Magic Hour voice generation failed: %s", exc, exc_info=True)
            return False, f"Magic Hour voice generation failed: {exc}"

    def text_to_video(
        self, prompt: str, output_path: str, duration_seconds: float = 5.0,
    ) -> Tuple[bool, Optional[str]]:
        """Generate a short child-safe video from a text description."""
        if not self.configured:
            return False, "Magic Hour API key is not configured."
        try:
            from magic_hour import Client
            client = Client(
                token=settings.MAGIC_HOUR_API_KEY,
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
            )
            with tempfile.TemporaryDirectory(prefix="anva-kids-video-") as temp_dir:
                result = client.v1.text_to_video.generate(
                    end_seconds=max(1.0, min(duration_seconds, 10.0)),
                    orientation="portrait",
                    style={"prompt": prompt},
                    # 480p is available on the current Magic Hour plan.
                    resolution="480p",
                    audio=True,
                    name="Anva Kids Text to Video",
                    wait_for_completion=True,
                    download_outputs=True,
                    download_directory=temp_dir,
                )
                return self._copy_video_result(result, output_path, "Text to Video")
        except Exception as exc:
            logger.warning("Magic Hour text-to-video failed: %s", exc, exc_info=True)
            return False, f"Magic Hour text-to-video failed: {exc}"

    @staticmethod
    def _copy_video_result(result, output_path: str, label: str) -> Tuple[bool, Optional[str]]:
        paths = getattr(result, "downloaded_paths", None) or []
        status = getattr(result, "status", None)
        if status != "complete" or not paths:
            message = (
                getattr(result, "error_message", None)
                or getattr(result, "error", None)
                or "Provider returned no video."
            )
            return False, f"Magic Hour {label} failed: {message}"
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(paths[0], output_path)
        return True, None


magic_hour_provider = MagicHourProvider()
