import cv2
import numpy as np
from ultralytics import YOLO

from app.services.imageUpload import imageUpload


class ImageAnalysis:
    def __init__(self):
        self.uploader = imageUpload()
        self.model = YOLO("../../../data/YOLOv8.pt")

    