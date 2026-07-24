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


magic_hour_provider = MagicHourProvider()
