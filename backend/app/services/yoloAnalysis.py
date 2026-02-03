import cv2
import numpy as np
from ultralytics import YOLO
import pickle
from PIL import Image
import os
import joblib
import pandas as pd

class YoloAnalysis:
    def __init__(self):
        BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        YOLO_MODEL_PATH = os.path.join(BASE_DIR, "data", "YOLOv8.pt")
        self.YOLOmodel = YOLO(YOLO_MODEL_PATH)

        DISTANCE_MODEL_PATH = os.path.join(BASE_DIR, "data", "distance_model_rf.joblib")
        with open(DISTANCE_MODEL_PATH, "rb") as f:
            self.distance_model = joblib.load(f)
        self.detections = []

    def sigmoid(self, x: float, k: float, x0: float) -> float:
        return 1 / (1 + np.exp(-k * (x - x0)))

    def extractStatistics(self, image):
        results = self.YOLOmodel(image)

        # Iterate through all results in image and extract bounding boxes and class names
        for r in results:
            for box in r.boxes:
                xMin, yMin, xMax, yMax = map(int, box.xyxy[0])
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = self.YOLOmodel.names[class_id]

                xCenter = (xMin + xMax) / 2
                yCenter = (yMin + yMax) / 2
                boxWidth = xMax - xMin
                boxHeight = yMax - yMin
                pixelArea = boxWidth * boxHeight

                aspectRatio = boxWidth / boxHeight if boxHeight != 0 else 0

                # Initialize score, calculate later
                score = 0

                # Distance, create data frame with columns correspodind to training features: confidence, area, score, width, height, aspect ratio
                distanceFeatures = pd.DataFrame([[confidence, pixelArea, score, boxWidth, boxHeight, aspectRatio]],
                        columns=['pred_conf', 'pred_area', 'score', 'width', 'height', 'aspect_ratio'])
                predictions = self.distance_model.predict(distanceFeatures)
                xDist = predictions[:, 0].item()
                yDist = predictions[:, 1].item()
                zDist = predictions[:, 2].item()

                self.detections.append({
                    "class_name": class_name,
                    "confidence": confidence,
                    "pixelArea": pixelArea,
                    "score": score,
                    "xMin": xMin,
                    "yMin": yMin,
                    "xMax": xMax,
                    "yMax": yMax,
                    "xCenter": xCenter,
                    "yCenter": yCenter,
                    "width": boxWidth,
                    "height": boxHeight,
                    "aspectRatio": aspectRatio,
                    "distance": {
                        "x": xDist,
                        "y": yDist,
                        "z": zDist,
                    },
                })

        # Calculate score
        for obj in self.detections:
            normArea = obj["pixelArea"] / max([obj["pixelArea"] for obj in self.detections])
            normConf = self.sigmoid(obj["confidence"], k=15.0, x0 = 0.67)
            obj["score"] = normArea * 0.5 + normConf * 0.5

        return {
            "success": True,
            "detections": self.detections,
            "count": len(self.detections),
        }

    def getMostProminent(self, detections):
        return {
            "success": True,
            "mostProminentObject": max(detections, key=lambda obj: obj["score"]),
        }
