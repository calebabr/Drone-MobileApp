import cv2
import numpy as np
from ultralytics import YOLO
import pickle
from PIL import Image

class YoloAnalysis:
    def __init__(self):
        self.model = YOLO("../../../data/YOLOv8.pt")
        with open("../../../data/distance_model.pkl", "rb") as f:
            self.distance_model = pickle.load(f)
        self.image = Image()
        self.featureList = []
        self.detections = []

    def sigmoid(self, x: float, k: float, x0: float) -> float:
        return 1 / (1 + np.exp(-k * (x - x0)))
    
    def extractDetections(self, image):
        height, width, _ = image.shape

        results = self.model(image)

        # Iterate through all results in image and extract bounding boxes and class names
        for r in results:
            for box in r.boxes:
                xMin, yMin, xMax, yMax = map(int, box.xyxy[0])
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id]

                self.detections.append({
                    "class_name": class_name,
                    "confidence": confidence,
                    "bbox": {
                        "xMin": xMin,
                        "yMin": yMin,
                        "xMax": xMax,
                        "yMax": yMax,
                        "xCenter": (xMin + xMax) / 2,
                        "yCenter": (yMin + yMax) / 2,
                        "width": xMax - xMin,
                        "height": yMax - yMin,
                        "pixelArea": (xMax - xMin) * (yMax - yMin)
                    }
                })

        return {
            "image_width": width,
            "image_height": height,
            "detections": self.detections
        }

    def computeProminent(self, detections,
                        k=15.0, x0=0.67,
                        confWeight=0.5, areaWeight=0.5):
        
        areas, confs, class_names, valid_dets = [], [], [], []

        for det in detections: # Add all individual statistic categories to their own arrays
            if not getattr(det, "class_name", None):
                continue
            if det.confidence <= 0.0 or det.pixel_area <= 0.0:
                continue
            areas.append(det.pixel_area)
            confs.append(det.confidence)
            class_names.append(det.class_name)
            valid_dets.append(det)

        if not valid_dets:
            return

        maxArea = max(areas)
    