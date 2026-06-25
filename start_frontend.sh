#!/bin/bash
# ─── FaceSwap AI — Frontend Startup Script ───────────────────────────────────
set -e

cd "$(dirname "$0")/react-native-frontend"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Installing via nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
fi

# Install deps
if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm dependencies..."
  npm install
fi

echo ""
echo "🚀 Starting Expo dev server..."
echo ""
echo "   Scan the QR code with Expo Go on your iPhone"
echo "   Or press 'i' to open iOS simulator"
echo ""

npx expo start
