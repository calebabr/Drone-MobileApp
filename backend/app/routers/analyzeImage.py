from fastapi import APIRouter, File, UploadFile, HTTPException
import numpy as np
import cv2

from app.services.yoloAnalysis import YoloAnalysis
from app.models import (
    ImageAnalysisResponse,
    MostProminentResponse,
    AnalysisHistoryResponse,
    SingleAnalysisResponse
)

router = APIRouter()
YOLOAnalyzer = YoloAnalysis()

@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an uploaded image, convert to OpenCV format and return detailed analysis
    with annotated image and statistics.
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

@router.get("/analysis-history", response_model=AnalysisHistoryResponse)
async def get_analysis_history():
    """
    Retrieve the history of all image analyses in this session.
    """
    history = YOLOAnalyzer.get_history()
    return {
        "success": True,
        "history": history
    }

@router.get("/analysis/{analysis_id}", response_model=SingleAnalysisResponse)
async def get_analysis_by_id(analysis_id: str):
    """
    Retrieve a specific analysis by its ID.
    """
    analysis = YOLOAnalyzer.get_analysis_by_id(analysis_id)

    if analysis is None:
        raise HTTPException(status_code=404, detail=f"Analysis with ID {analysis_id} not found")

    return {
        "success": True,
        "analysis": analysis
    }

@router.delete("/analysis-history")
async def clear_analysis_history():
    """
    Clear all analysis history.
    """
    result = YOLOAnalyzer.clear_history()
    return result