#!/bin/bash
# ─── FaceSwap AI — Backend Startup Script ────────────────────────────────────
set -e

cd "$(dirname "$0")/backend"

echo "🤖 Setting up FaceSwap AI backend..."

# Create virtual environment if needed
if [ ! -d "venv" ]; then
  echo "📦 Creating Python virtual environment..."
  python3 -m venv venv
fi

# Activate
source venv/bin/activate

# Install deps
echo "📥 Installing dependencies (this may take a minute)..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Create directories
mkdir -p uploads outputs pose_templates

echo ""
echo "✅ Starting backend server at http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
