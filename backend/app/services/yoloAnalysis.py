import cv2
import numpy as np
from ultralytics import YOLO
from PIL import Image

from app.services.imageUpload import imageUpload


class YoloAnalysis:
    def __init__(self):
        self.uploader = imageUpload()
        self.model = YOLO("../../../data/YOLOv8.pt")
        self.image = Image()

    def analyzeImage(self, image):
        height, width, _ = image.shape

        results = self.model(image)

        detections = []

        # Iterate through all results in image and extract bounding boxes and class names
        for r in results:
            for box in r.boxes:
                xMin, yMin, xMax, yMax = map(int, box.xyxy[0])
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id]

                detections.append({
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
            "detections": detections
        }


    