from pydantic import BaseModel, Field
from typing import List

class BoundingBox(BaseModel):
    xMin: float
    yMin: float
    xMax: float
    yMax: float
    xCenter: float
    yCenter:float
    width: float
    height: float
    pixelArea: float

class Detection(BaseModel):
    className: str
    confidence: float
    bBox: BoundingBox

class ImageAnalysisResponse(BaseModel):
    imageWidth: int
    imageHeight: int
    detections: List[Detection]
    maxArea: float

class ProminentData(BaseModel):
    className: str
    xCenter: float
    yCenter: float
    sizeScore: float

class ProminentObjectArray(BaseModel):
    prominentObjects: List[ProminentData]

class YOLOFeatures(BaseModel):
    confidence: float
    pixelArea: float
    score: float
    bboxWidth: float
    bboxHeight: float
    bboxAspectRatio: float

class DistanceXYZ(BaseModel):
    xDistance: float
    yDistance: float
    zDistance: float
