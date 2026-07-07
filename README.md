# Fun With AI 🤖✨

An AI-powered face swap and pose generation mobile app — similar to Look Swap Me.
Upload your photo, pick a style, and the AI places your face onto any pose.

---

## Screenshots

> Home screen with 2-column AI Studios grid, dark purple theme, studio detail with pose picker, and generated result.

---

## Tech Stack

### Frontend — React Native (Expo SDK 54)
- **React Native 0.81** + **Expo SDK 54**
- **Expo Router v6** — file-based navigation
- **TypeScript**
- **Zustand** — state management
- **expo-linear-gradient**, **expo-blur**, **expo-haptics**
- **expo-image-picker** — camera + photo library

### Backend — Python / FastAPI
- **FastAPI** + **Uvicorn**
- **SQLAlchemy async** + **SQLite**
- **JWT auth** (python-jose + bcrypt)
- **OpenCV** — face detection and blending
- **Pillow** — image generation

### AI Models
| Model | Purpose |
|---|---|
| **InsightFace buffalo_sc** | RetinaFace — precise face detection + landmarks |
| **inswapper_128.onnx** | Neural face swap (optional, ~540MB) |
| **OpenCV Haar cascade** | Fallback face detection |

---

## Project Structure

```
faceswap_app/
├── backend/                  # Python FastAPI backend
│   ├── app/
│   │   ├── ai/               # AI pipeline (face detect, image processor)
│   │   ├── routers/          # API routes (auth, poses, generate)
│   │   ├── models.py         # SQLAlchemy DB models
│   │   ├── schemas.py        # Pydantic schemas
│   │   └── seed.py           # DB seeder
│   ├── main.py               # FastAPI entry point
│   ├── requirements.txt
│   └── download_models.py    # Download inswapper_128.onnx
│
├── react-native-frontend/    # Expo React Native app
│   ├── app/
│   │   ├── (tabs)/           # Tab screens (Home, Explore, Create, History, Profile)
│   │   ├── studio/[id].tsx   # Studio detail + generate screen
│   │   └── auth/             # Login / Register screens
│   ├── components/           # Reusable UI components
│   ├── constants/            # Theme, studio definitions
│   └── services/api.ts       # API client
│
├── start_backend.sh
├── start_frontend.sh
└── README.md
```

---

## Running Locally

### Prerequisites
- Python 3.12+
- Node.js 20+ (via NVM)
- iPhone with **Expo Go** installed (App Store)
- Both phone and computer on the **same WiFi**

### 1. Backend Setup (first time)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install "pydantic[email]" insightface onnxruntime
```

### 2. Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
API docs available at: `http://localhost:8000/docs`

### 3. Frontend Setup (first time)
```bash
cd react-native-frontend
npm install --legacy-peer-deps
```

### 4. Update your machine IP
Edit `react-native-frontend/services/api.ts` and `app/studio/[id].tsx`:
```ts
const API = 'http://YOUR_MACHINE_IP:8000';
```
Find your IP with: `hostname -I | awk '{print $1}'`

### 5. Start Frontend
```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
cd react-native-frontend
npx expo start --lan --clear
```
Scan the QR code with **Expo Go** on your iPhone.

### 6. Optional — Download full AI model for best quality
```bash
cd backend
source venv/bin/activate
python3 download_models.py   # downloads ~540MB inswapper_128.onnx
```

---

## How Generation Works

```
1. Upload your photo on the app
2. Select a studio (Fitness, Outfit, Professional, etc.)
3. Pick a pose style
4. Tap "Generate My Look"
5. Backend detects your face → downloads target pose photo
6. AI swaps your face onto the target body
7. Result displayed with Save / Share options
```

---

## Environment Variables

Copy `backend/.env` and set:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | change-me | JWT signing secret |
| `USE_AI_MODELS` | false | Set true to enable Stable Diffusion (GPU only) |
| `DEVICE` | cpu | cpu or cuda |

---

## License

MIT
