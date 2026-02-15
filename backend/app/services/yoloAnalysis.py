import cv2
import numpy as np
from ultralytics import YOLO
import pickle
from PIL import Image
import os
import joblib
import pandas as pd
import base64
from datetime import datetime
from collections import Counter

class YoloAnalysis:
    def __init__(self):
        BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        YOLO_MODEL_PATH = os.path.join(BASE_DIR, "data", "YOLOv8.pt")
        self.YOLOmodel = YOLO(YOLO_MODEL_PATH)

        DISTANCE_MODEL_PATH = os.path.join(BASE_DIR, "data", "distance_model_rf.joblib")
        with open(DISTANCE_MODEL_PATH, "rb") as f:
            self.distance_model = joblib.load(f)

        self.detections = []
        self.analysis_history = []  # Store analysis history

    def sigmoid(self, x: float, k: float, x0: float) -> float:
        return 1 / (1 + np.exp(-k * (x - x0)))

    def annotate_image(self, image, detections):
        """Draw bounding boxes and labels on the image"""
        annotated = image.copy()

        for obj in detections:
            # Draw bounding box
            cv2.rectangle(
                annotated,
                (obj["xMin"], obj["yMin"]),
                (obj["xMax"], obj["yMax"]),
                (0, 255, 0),  # Green color
                2
            )

            # Prepare label with class name, confidence, and score
            label = f"{obj['class_name']}: {obj['confidence']:.2f} (S:{obj['score']:.2f})"

            # Calculate label size for background
            (label_width, label_height), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )

            # Draw label background
            cv2.rectangle(
                annotated,
                (obj["xMin"], obj["yMin"] - label_height - 10),
                (obj["xMin"] + label_width, obj["yMin"]),
                (0, 255, 0),
                -1
            )

            # Draw label text
            cv2.putText(
                annotated,
                label,
                (obj["xMin"], obj["yMin"] - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 0),
                1
            )

        return annotated

    def image_to_base64(self, image):
        """Convert OpenCV image to base64 string"""
        _, buffer = cv2.imencode('.jpg', image)
        return base64.b64encode(buffer).decode('utf-8')

    def calculate_statistics(self, detections, image_shape):
        """Calculate comprehensive statistics about the detections"""
        if not detections:
            return {
                "total_objects": 0,
                "unique_classes": 0,
                "class_distribution": {},
                "average_confidence": 0,
                "average_size": 0,
                "coverage_percentage": 0
            }

        # Class distribution
        class_counts = Counter([obj["class_name"] for obj in detections])

        # Average metrics
        avg_confidence = np.mean([obj["confidence"] for obj in detections])
        avg_area = np.mean([obj["pixelArea"] for obj in detections])
        avg_score = np.mean([obj["score"] for obj in detections])

        # Coverage calculation
        total_detection_area = sum([obj["pixelArea"] for obj in detections])
        image_area = image_shape[0] * image_shape[1]
        coverage_percentage = (total_detection_area / image_area) * 100

        # Distance statistics
        avg_distance = {
            "x": np.mean([obj["distance"]["x"] for obj in detections]),
            "y": np.mean([obj["distance"]["y"] for obj in detections]),
            "z": np.mean([obj["distance"]["z"] for obj in detections])
        }

        return {
            "total_objects": len(detections),
            "unique_classes": len(class_counts),
            "class_distribution": dict(class_counts),
            "average_confidence": float(avg_confidence),
            "average_area": float(avg_area),
            "average_score": float(avg_score),
            "coverage_percentage": float(coverage_percentage),
            "average_distance": avg_distance,
            "size_range": {
                "min": float(min([obj["pixelArea"] for obj in detections])),
                "max": float(max([obj["pixelArea"] for obj in detections]))
            }
        }

    def extractStatistics(self, image):
        """Main analysis function with enhanced statistics and visualization"""
        self.detections = []
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

                # Distance prediction
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
                        "x": float(xDist),
                        "y": float(yDist),
                        "z": float(zDist),
                    },
                })

        # Calculate score
        if self.detections:
            max_area = max([obj["pixelArea"] for obj in self.detections])
            for obj in self.detections:
                normArea = obj["pixelArea"] / max_area
                normConf = self.sigmoid(obj["confidence"], k=15.0, x0=0.67)
                obj["score"] = normArea * 0.5 + normConf * 0.5

        # Generate annotated image
        annotated_image = self.annotate_image(image, self.detections)
        annotated_base64 = self.image_to_base64(annotated_image)

        # Calculate statistics
        statistics = self.calculate_statistics(self.detections, image.shape)

        # Generate unique analysis ID
        analysis_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")

        # Create thumbnail for history
        thumbnail = cv2.resize(annotated_image, (200, 150))
        thumbnail_base64 = self.image_to_base64(thumbnail)

        # Store in history
        self.analysis_history.append({
            "analysis_id": analysis_id,
            "timestamp": datetime.now().isoformat(),
            "count": len(self.detections),
            "thumbnail": thumbnail_base64,
            "statistics": statistics,
            "detections": self.detections.copy(),
            "annotated_image": annotated_base64
        })

        return {
            "success": True,
            "detections": self.detections,
            "count": len(self.detections),
            "annotated_image": annotated_base64,
            "statistics": statistics,
            "analysis_id": analysis_id
        }

    def getMostProminent(self, detections):
        """Original function name maintained"""
        if not detections:
            return None
        return {
            "success": True,
            "mostProminentObject": max(detections, key=lambda obj: obj["score"]),
        }

    def get_history(self):
        """Return analysis history"""
        return [{
            "analysis_id": item["analysis_id"],
            "timestamp": item["timestamp"],
            "count": item["count"],
            "thumbnail": item["thumbnail"],
            "statistics": item["statistics"]
        } for item in self.analysis_history]

    def get_analysis_by_id(self, analysis_id):
        """Retrieve a specific analysis from history"""
        for item in self.analysis_history:
            if item["analysis_id"] == analysis_id:
                return {
                    "success": True,
                    "detections": item["detections"],
                    "count": item["count"],
                    "annotated_image": item["annotated_image"],
                    "statistics": item["statistics"],
                    "analysis_id": item["analysis_id"]
                }
        return None

    def clear_history(self):
        """Clear analysis history"""
        self.analysis_history = []
        return {"success": True, "message": "History cleared"}

yolo_analyzer = YoloAnalysis()
