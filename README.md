# Drone Image Analysis App

Mobile app for analyzing drone imagery using YOLOv8 object detection with AI-powered chat assistant.

## Prerequisites

- Python 3.10+
- Node.js 18+
- Expo CLI
- OpenAI API key

## Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Download model files and place in `backend/data/`:
   - `YOLOv8.pt` - YOLO detection model
   - `distance_model_rf.joblib` - Distance estimation model

5. Create `.env` file in `backend/` folder:
```
OPENAI_API_KEY=your_key_here
```

6. Run the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`

## Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update backend URL in `src/config/constants.js`:
```javascript
export const BACKEND_URL = 'http://YOUR_IP_ADDRESS:8000';
```

4. Run the app:
```bash
npx expo start
```

5. Scan QR code with Expo Go app on your phone

## Project Structure
```
.
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── routers/
│   │   │   ├── analyzeImage.py
│   │   │   └── chat.py
│   │   └── services/
│   │       ├── yoloAnalysis.py
│   │       └── chatService.py
│   ├── data/
│   │   ├── YOLOv8.pt (not in repo)
│   │   └── distance_model_rf.joblib (not in repo)
│   ├── requirements.txt
│   └── .env (not in repo)
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── config/
    │   ├── services/
    │   ├── styles/
    │   └── utils/
    ├── App.js
    ├── app.json
    └── package.json
```

## Features

- YOLOv8 object detection on drone images
- Distance estimation for detected objects
- Annotated image visualization with bounding boxes
- Comprehensive detection statistics
- Analysis history tracking
- AI chatbot for answering questions about detections

## API Endpoints

- `POST /analyze-image` - Analyze uploaded image
- `GET /most-prominent-object` - Get most prominent detection
- `GET /analysis-history` - Get all analyses in session
- `GET /analysis/{analysis_id}` - Get specific analysis
- `DELETE /analysis-history` - Clear history
- `POST /chat` - Chat with AI about analysis
- `DELETE /chat/history` - Clear chat history