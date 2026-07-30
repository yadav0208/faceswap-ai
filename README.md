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

## How Generation Works

```
1. Upload your photo on the app
2. Select a locally bundled Anva template
3. Pick a motion or portrait style
4. Tap Generate
5. Backend validates the upload
6. Magic Hour creates the image, video, or lip-synced result
7. Result displayed with Save / Share options
```

---

## Environment Variables

Copy `backend/.env` and set:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | change-me | JWT signing secret |
| `IMAGE_PROVIDER` | magic_hour | Image generation provider |
| `FACE_SWAP_PROVIDER` | magic_hour | Managed face-swap provider; local blend is fallback |
| `MAGIC_HOUR_API_KEY` | empty | Magic Hour free-credit API key |
| `MAGIC_HOUR_IMAGE_MODEL` | flux-schnell | Prompt-to-image model |

---

## Production deployment

The repository includes separate production templates:

- `backend/.env.production.example`
- `react-native-frontend/.env.production.example`
- `react-native-frontend/eas.json`
- `backend/Dockerfile`

For a production Railway deployment:

1. Add Railway's MySQL service and set the backend reference variable
   `DATABASE_URL=${{MySQL.MYSQL_URL}}` (rename `MySQL` if the service has another name).
2. Attach a persistent volume at `/data`; configure uploads and outputs to use it.
3. Add every variable from `backend/.env.production.example` through Railway Secrets.
4. Set exact HTTPS frontend origins and backend trusted hosts.
5. Configure Magic Hour, Twilio SMS, and SMTP credentials.
6. Deploy the backend Dockerfile and verify `/health`.
7. Set `EXPO_PUBLIC_API_URL` to the HTTPS backend URL in the EAS production profile.
8. Build with `eas build --profile production --platform android` or `--platform ios`.

Generate the signing secret locally with `openssl rand -hex 32`, then paste only its
output into Railway's `SECRET_KEY` variable. Use `backend/.env.railway` as the exact
Railway variable checklist. Do not upload that file with real credential values.

Production startup intentionally fails when it detects SQLite, wildcard or insecure
CORS, or a weak signing secret. Optional integrations report a feature-level error
instead of taking authentication and the whole API offline. API documentation is
disabled when `ENABLE_DOCS=false`. Secrets belong in the deployment provider and must
never be committed to the repository.

Generated media requires the `/data` persistent volume. Without it, container restarts
can remove uploads and results even though database records remain.

---

## License

MIT
