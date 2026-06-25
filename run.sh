#!/bin/bash
# ─────────────────────────────────────────────────────
#   FaceSwap AI — One-command launcher
# ─────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║        FaceSwap AI Launcher           ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# ── 1. Start Backend ──────────────────────────────
echo "▶  Starting backend (FastAPI)..."

cd "$ROOT/backend"
source venv/bin/activate

# Kill any process on port 8000
fuser -k 8000/tcp 2>/dev/null || true

# Start in background
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "   Waiting for backend..."
for i in {1..15}; do
  sleep 1
  STATUS=$(python3 -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())" 2>/dev/null)
  if [[ "$STATUS" == *"healthy"* ]]; then
    echo "   ✅ Backend ready → http://localhost:8000"
    echo "   📖 API docs     → http://localhost:8000/docs"
    break
  fi
  echo "   ... ($i/15)"
done

echo ""

# ── 2. Start Frontend ─────────────────────────────
echo "▶  Starting frontend (Expo)..."
cd "$ROOT/react-native-frontend"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📱 To run on your iPhone:"
echo "     1. Install 'Expo Go' from the App Store"
echo "     2. Scan the QR code that appears below"
echo ""
echo "  🖥  To run in iOS Simulator:"
echo "     Press  i  after the QR code appears"
echo ""
echo "  🌐 To run in browser (limited):"
echo "     Press  w  after the QR code appears"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trap Ctrl+C to kill backend
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID 2>/dev/null; exit 0" INT TERM

npx expo start --tunnel
