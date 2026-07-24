"""Hugging Face Inference Providers text-to-image adapter."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional, Tuple

from app.config import settings

logger = logging.getLogger(__name__)


class HuggingFaceProvider:
    @property
    def configured(self) -> bool:
        return bool(settings.HF_TOKEN)

    def generate_image(
        self,
        prompt: str,
        output_path: str,
    ) -> Tuple[bool, Optional[str]]:
        if not self.configured:
            return False, (
                "Hugging Face is selected but HF_TOKEN is empty. Create a free token "
                "with Inference Providers permission and add it to backend/.env."
            )
        try:
            from huggingface_hub import InferenceClient

            client = InferenceClient(
                provider=settings.HF_PROVIDER,
                api_key=settings.HF_TOKEN,
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
            )
            image = client.text_to_image(
                prompt,
                model=settings.HF_IMAGE_MODEL,
                negative_prompt=(
                    "blurry, low quality, distorted face, duplicate person, extra limbs, "
                    "bad hands, bad anatomy, text, watermark, logo"
                ),
                width=settings.IMAGE_WIDTH,
                height=settings.IMAGE_HEIGHT,
                num_inference_steps=settings.HF_IMAGE_STEPS,
            )
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            image.convert("RGB").save(output_path, format="JPEG", quality=95)
            return True, None
        except Exception as exc:
            logger.warning("Hugging Face generation failed: %s", exc)
            return False, f"Hugging Face image generation failed: {exc}"


huggingface_provider = HuggingFaceProvider()

