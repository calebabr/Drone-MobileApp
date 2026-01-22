import cv2

from app.services.yoloAnalysis import YoloAnalysis

yoloAnalyzer = YoloAnalysis()

img = cv2.imread("test.jpg")
result = yoloAnalyzer.analyzeImage(img)
