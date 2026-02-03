# Drone Image Analysis App

A React Native mobile app for uploading images and analyzing them using YOLO object detection.

## Features

- Pick images from gallery
- Take photos with camera
- Analyze images with YOLO backend
- Display detection statistics
- Show detected objects with confidence scores

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Backend URL

Open `App.js` and update the backend URL constants (around line 21-22) with your FastAPI server address:

```javascript
const BACKEND_URL = 'http://YOUR_BACKEND_IP:PORT/analyze-image';
const PROMINENT_URL = 'http://YOUR_BACKEND_IP:PORT/most-prominent-object';
```

**Important Notes:**
- Run "ipconfig" in a command prompt and note down the IPv4 address. That will be the FastAPI server address that you will use. Port should always be 8000. 

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

FastAPI backend has endpoints:

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
uvicorn main:app --reload --host 0.0.0.0 --reload
```

## Troubleshooting

### "Network Error" when analyzing
- Make sure your backend server is running
- Check that the BACKEND_URL is correct
- Ensure your phone and backend are on the same network (for local testing)

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

