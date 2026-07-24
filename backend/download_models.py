"""
Downloads the inswapper_128.onnx model for full face swap quality.
Run once: python3 download_models.py
Model size: ~540MB
Source: https://github.com/deepinsight/insightface
"""
import urllib.request
import os
from pathlib import Path
from dotenv import load_dotenv

MODEL_URL = "https://huggingface.co/deepinsight/inswapper/resolve/main/inswapper_128.onnx"
OUT_PATH = Path("models/inswapper_128.onnx")

def download():
    load_dotenv()
    OUT_PATH.parent.mkdir(exist_ok=True)
    if OUT_PATH.exists():
        print(f"✅ Model already exists: {OUT_PATH} ({OUT_PATH.stat().st_size // 1024 // 1024}MB)")
        return

    print(f"Downloading inswapper_128.onnx (~540MB)...")
    print(f"Source: {MODEL_URL}")

    def reporthook(count, block, total):
        pct = min(100, int(count * block * 100 / total))
        mb = count * block / 1024 / 1024
        print(f"\r  {pct}% ({mb:.1f} MB)", end="", flush=True)

    headers = {"User-Agent": "Anva-AI/1.0"}
    hf_token = os.getenv("HF_TOKEN", "").strip()
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"
    req = urllib.request.Request(MODEL_URL, headers=headers)
    tmp = str(OUT_PATH) + ".tmp"
    try:
        with urllib.request.urlopen(req) as response, open(tmp, "wb") as output:
            total = int(response.headers.get("Content-Length", 0))
            count = 0
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
                count += 1
                if total:
                    reporthook(count, 1024 * 1024, total)
        os.rename(tmp, str(OUT_PATH))
        print(f"\n✅ Saved to {OUT_PATH}")
    except Exception as e:
        if os.path.exists(tmp):
            os.remove(tmp)
        print(f"\n❌ Download failed: {e}")
        print("You can manually download from:")
        print("  https://huggingface.co/deepinsight/inswapper/resolve/main/inswapper_128.onnx")
        print(f"  and place it at: {OUT_PATH.absolute()}")

if __name__ == "__main__":
    download()
