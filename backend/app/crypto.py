"""
AES-256-GCM payload encryption / decryption.

Every JSON response body is encrypted before sending.
Every JSON request body must be sent encrypted.

Wire format (base64-encoded JSON envelope):
  {
    "iv":  "<12-byte nonce, base64>",
    "ct":  "<ciphertext, base64>",
    "tag": "<16-byte auth tag, base64>"
  }

The frontend decrypts using the same ENCRYPTION_KEY.
Binary endpoints (images, file uploads) are NOT encrypted —
they use the normal multipart/file response flow.
"""
import base64
import json
import os
from typing import Any

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings


def _key() -> bytes:
    """Return the 32-byte AES key from hex config."""
    raw = settings.ENCRYPTION_KEY
    if len(raw) != 64:
        raise ValueError("ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)")
    return bytes.fromhex(raw)


def encrypt_payload(data: Any) -> str:
    """
    Serialize `data` to JSON, encrypt with AES-256-GCM.
    Returns a base64-encoded JSON envelope string.
    """
    plaintext = json.dumps(data, default=str).encode("utf-8")
    iv = os.urandom(12)          # 96-bit nonce — recommended for GCM
    aesgcm = AESGCM(_key())
    ct_with_tag = aesgcm.encrypt(iv, plaintext, None)
    # AESGCM.encrypt appends the 16-byte tag at the end
    ct = ct_with_tag[:-16]
    tag = ct_with_tag[-16:]
    envelope = {
        "iv":  base64.b64encode(iv).decode(),
        "ct":  base64.b64encode(ct).decode(),
        "tag": base64.b64encode(tag).decode(),
    }
    return base64.b64encode(json.dumps(envelope).encode()).decode()


def decrypt_payload(envelope_b64: str) -> Any:
    """
    Decrypt a base64-encoded AES-256-GCM envelope.
    Returns the original deserialized object.
    Raises ValueError on tampered / invalid data.
    """
    try:
        envelope = json.loads(base64.b64decode(envelope_b64).decode())
        iv  = base64.b64decode(envelope["iv"])
        ct  = base64.b64decode(envelope["ct"])
        tag = base64.b64decode(envelope["tag"])
        aesgcm = AESGCM(_key())
        plaintext = aesgcm.decrypt(iv, ct + tag, None)
        return json.loads(plaintext.decode("utf-8"))
    except Exception as e:
        raise ValueError(f"Decryption failed: {e}")
