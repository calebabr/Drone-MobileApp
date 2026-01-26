import cv2
import os
from app.services.yoloAnalysis import YoloAnalysis

yoloAnalyzer = YoloAnalysis()

script_dir = os.path.dirname(os.path.abspath(__file__))
img_path = os.path.join(script_dir, "treeTest.jpg")
img = cv2.imread(img_path)
result = yoloAnalyzer.extractStatistics(img)
data = result['detections']
print(data[8])