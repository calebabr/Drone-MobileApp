# Drone Image Analysis App

A React Native mobile app for uploading images and analyzing them using YOLO object detection.

## Features

- 📷 Pick images from gallery
- 📸 Take photos with camera
- 🔍 Analyze images with YOLO backend
- 📊 Display detection statistics
- 🎯 Show detected objects with confidence scores

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Backend URL

Open `App.js` and update the backend URL constants (around line 18-19) with your FastAPI server address:

```javascript
const BACKEND_URL = 'http://YOUR_BACKEND_IP:PORT/analyze-image';
const PROMINENT_URL = 'http://YOUR_BACKEND_IP:PORT/most-prominent-object';
```

**Important Notes:**
- For Android emulator: use `http://10.0.2.2:8000/analyze-image` if backend is on localhost (default FastAPI port is 8000)
- For physical device: use your computer's IP address (e.g., `http://192.168.1.100:8000/analyze-image`)
- For iOS simulator: use `http://localhost:8000/analyze-image`

### 3. Run the App

```bash
# Start the Expo development server
npm start

# Or run directly on a platform
npm run android  # For Android
npm run ios      # For iOS (Mac only)
```

### 4. Test on Your Device

1. Install the **Expo Go** app on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code from the Expo development server

## Backend Requirements

Your FastAPI backend should have these endpoints:

### 1. POST `/analyze-image`
Accepts an image file and returns detection results:

```json
{
  "success": true,
  "count": 3,
  "detections": [
    {
      "class_name": "person",
      "confidence": 0.95,
      "pixelArea": 45000,
      "score": 0.823,
      "xMin": 100,
      "yMin": 50,
      "xMax": 300,
      "yMax": 450,
      "xCenter": 200,
      "yCenter": 250,
      "width": 200,
      "height": 400,
      "aspectRatio": 0.5,
      "distance": {
        "x": 2.5,
        "y": 1.2,
        "z": 5.8
      }
    }
  ]
}
```

### 2. GET `/most-prominent-object`
Returns the object with the highest score from the last analysis:

```json
{
  "success": true,
  "mostProminentObject": {
    "class_name": "person",
    "confidence": 0.95,
    "score": 0.823,
    "distance": {
      "x": 2.5,
      "y": 1.2,
      "z": 5.8
    }
    // ... other fields
  }
}
```

### Running Your FastAPI Backend

Make sure your FastAPI server is running:

```bash
# Navigate to your backend directory
cd path/to/backend

# Run with uvicorn (default port 8000)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Troubleshooting

### "Network Error" when analyzing
- Make sure your backend server is running
- Check that the BACKEND_URL is correct
- Ensure your phone and backend are on the same network (for local testing)
- For Android emulator, use `10.0.2.2` instead of `localhost`

### Camera/Gallery permissions not working
- Make sure you've granted permissions when prompted
- Try restarting the app
- Check app permissions in your device settings

### App won't start
```bash
# Clear cache and restart
npm start -- --clear
```

## Project Structure

```
frontend/
├── App.js              # Main application component
├── package.json        # Dependencies
├── app.json           # Expo configuration
└── README.md          # This file
```

## Next Steps

- Add image preprocessing options
- Display annotated images with bounding boxes
- Save analysis history
- Add export functionality for results
- Implement real-time camera analysis

## License

MIT
