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

class ProminentObject(BaseModel):
    className: str
    xCenter: float
    yCenter: float
    sizeScore: float

class ProminentObjectArray(BaseModel):
    prominentObjects: List[ProminentObject]