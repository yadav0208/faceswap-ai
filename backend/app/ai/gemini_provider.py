"""Google Gemini provider for prompt enhancement and native image generation."""
from __future__ import annotations

import base64
import logging
from pathlib import Path
from typing import Optional, Tuple

import httpx

from app.config import settings
from app.ai.prompt_engine import clean_prompt

logger = logging.getLogger(__name__)
_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiProvider:
    @property
    def configured(self) -> bool:
        return bool(settings.GEMINI_API_KEY)

    def _request(self, model: str, payload: dict) -> dict:
        if not self.configured:
            raise RuntimeError("Gemini API key is not configured.")
        url = f"{_BASE_URL}/{model}:generateContent"
        try:
            response = httpx.post(
                url,
                headers={
                    "x-goog-api-key": settings.GEMINI_API_KEY,
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
            )
        except httpx.RequestError as exc:
            raise RuntimeError(f"Could not reach Gemini: {exc}") from exc

        if response.is_error:
            try:
                message = response.json().get("error", {}).get("message")
            except Exception:
                message = response.text[:300]
            raise RuntimeError(message or f"Gemini returned HTTP {response.status_code}.")
        return response.json()

    def enhance_prompt(self, prompt: str) -> str:
        prompt = clean_prompt(prompt)
        payload = {
            "contents": [{
                "role": "user",
                "parts": [{"text": (
                    "Rewrite the following idea as one production-ready image-generation prompt. "
                    "Preserve the user's subject and intent. Add composition, environment, camera, "
                    "lighting, materials and color details. Do not add headings, quotes, explanations, "
                    "artist names, copyrighted characters, or negative prompts. Keep it under 120 words.\n\n"
                    f"IDEA: {prompt}"
                )}],
            }],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 220},
        }
        data = self._request(settings.GEMINI_TEXT_MODEL, payload)
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError("Gemini returned no enhanced prompt.") from exc
        return clean_prompt(text, max_length=1000)

    def generate_image(
        self,
        prompt: str,
        output_path: str,
        aspect_ratio: str = "1:1",
    ) -> Tuple[bool, Optional[str]]:
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseModalities": ["IMAGE"],
                "responseFormat": {"image": {"aspectRatio": aspect_ratio}},
            },
        }
        try:
            data = self._request(settings.GEMINI_IMAGE_MODEL, payload)
            parts = data["candidates"][0]["content"]["parts"]
            image_part = next(
                (part.get("inlineData") or part.get("inline_data") for part in parts
                 if part.get("inlineData") or part.get("inline_data")),
                None,
            )
            if not image_part or not image_part.get("data"):
                return False, "The image model returned no image. Check model access and billing."
            image_bytes = base64.b64decode(image_part["data"])
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            Path(output_path).write_bytes(image_bytes)
            return True, None
        except Exception as exc:
            logger.warning("Gemini image generation failed: %s", exc)
            return False, str(exc)


gemini_provider = GeminiProvider()

