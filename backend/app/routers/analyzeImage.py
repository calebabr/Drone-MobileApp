from fastapi import APIRouter, File, UploadFile, HTTPException
import numpy as np
import cv2

from app.services.yoloAnalysis import YoloAnalysis
from app.models import ImageAnalysisResponse, MostProminentResponse

router = APIRouter()
YOLOAnalyzer = YoloAnalysis()

@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an uploaded image, convert to OpenCV format and return a description.
    """

    imageBytes = await file.read()

    # Image to OpenCV
    npImage = np.frombuffer(imageBytes, np.uint8)
    cvImage = cv2.imdecode(npImage, cv2.IMREAD_COLOR)

    if cvImage is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Pass OpenCV image to service
    imgAnalysis = YOLOAnalyzer.extractStatistics(cvImage)
    YOLOAnalyzer.detections = imgAnalysis['detections']

    return imgAnalysis

@router.get("/most-prominent-object", response_model=MostProminentResponse)
async def get_most_prominent_object():
    """
    Retrieve the most prominent detected object from the last analyzed image.
    """
    if not YOLOAnalyzer.detections:
        raise HTTPException(status_code=404, detail="No detections available. Please analyze an image first.")

    mostProminent = YOLOAnalyzer.getMostProminent(YOLOAnalyzer.detections)

    return mostProminent