FROM python:3.11-slim

# System deps for OpenCV headless
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies (slim set — Magic Hour only)
COPY requirements-railway.txt .
RUN pip install --no-cache-dir -r requirements-railway.txt

# Copy app source
COPY . .

# Create runtime directories
RUN mkdir -p uploads outputs pose_templates/premium \
    && useradd --create-home --uid 10001 anva \
    && chown -R anva:anva /app

USER anva

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:' + __import__('os').environ.get('PORT', '8080') + '/health', timeout=4)"

# Railway injects $PORT (default 8080) — bind to it
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --proxy-headers --forwarded-allow-ips='*'"]
