from fastapi import APIRouter, File, UploadFile, HTTPException
import numpy as np
import cv2

from app.services.yoloAnalysis import analyze_image
from app.models import ImageAnalysisResponse

router = APIRouter()

@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an uploaded image and return a description.
    """

    imageBytes = await file.read()

    # Image to OpenCV
    npImage = np.frombuffer(imageBytes, np.uint8)
    cvImage = cv2.imdecode(npImage, cv2.IMREAD_COLOR)

    if cvImage is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Pass OpenCV image to service
    result = analyze_image(cvImage)
    return result