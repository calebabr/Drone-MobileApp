# app/services/yoloAnalysis.py
import os

# Get the absolute path to the data folder
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
YOLO_MODEL_PATH = os.path.join(BASE_DIR, "data", "YOLOv8.pt")

print(YOLO_MODEL_PATH)  # optional: check the path
