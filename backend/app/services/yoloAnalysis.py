import cv2
import numpy as np
from ultralytics import YOLO
import pickle
from PIL import Image
import os


class YoloAnalysis:
    def __init__(self):
        BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        YOLO_MODEL_PATH = os.path.join(BASE_DIR, "data", "YOLOv8.pt")
        self.model = YOLO(YOLO_MODEL_PATH)
        # with open("../../../data/distance_model.pkl", "rb") as f:
        #    self.distance_model = pickle.load(f)
        self.detections = []

    def sigmoid(self, x: float, k: float, x0: float) -> float:
        return 1 / (1 + np.exp(-k * (x - x0)))
    
    def extractStatistics(self, image):
        results = self.model(image)

        # Iterate through all results in image and extract bounding boxes and class names
        for r in results:
            for box in r.boxes:
                xMin, yMin, xMax, yMax = map(int, box.xyxy[0])
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id]

                xCenter = (xMin + xMax) / 2
                yCenter = (yMin + yMax) / 2
                boxWidth = xMax - xMin
                boxHeight = yMax - yMin
                pixelArea = boxWidth * boxHeight

                aspectRatio = boxWidth / boxHeight if boxHeight != 0 else 0

                score = 0

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
                    "aspectRatio": aspectRatio
                })

        for obj in self.detections:
            normArea = obj["pixelArea"] / max([obj["pixelArea"] for obj in self.detections])
            normConf = self.sigmoid(obj["confidence"], k=15.0, x0 = 0.67)
            obj["score"] = normArea * 0.5 + normConf * 0.5
        
        return {
            "success": True,
            "detections": self.detections,
            "count": len(self.detections),
        }