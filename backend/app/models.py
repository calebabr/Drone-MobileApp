from pydantic import BaseModel, Field
from typing import List, Optional

class Detection(BaseModel):
    class_name: str
    confidence: float
    pixelArea: float
    score: float
    xMin: int
    yMin: int
    xMax: int
    yMax: int
    xCenter: float
    yCenter: float
    width: int
    height: int
    aspectRatio: float
    distance: dict

class ImageAnalysisResponse(BaseModel):
    success: bool = Field(..., description="Indicates if the analysis was successful")
    detections: List[Detection] = Field(..., description="List of detected objects with their statistics")
    count: int = Field(..., description="Total number of detected objects")
    annotated_image: str = Field(..., description="Base64 encoded annotated image")
    statistics: dict = Field(..., description="Overall image statistics")
    analysis_id: str = Field(..., description="Unique identifier for this analysis")

class MostProminentResponse(BaseModel):
    success: bool = Field(..., description="Indicates if the retrieval was successful")
    mostProminentObject: Detection = Field(..., description="Details of the most prominent detected object")

class AnalysisHistoryItem(BaseModel):
    analysis_id: str
    timestamp: str
    count: int
    thumbnail: str  # Base64 encoded thumbnail
    statistics: dict

class AnalysisHistoryResponse(BaseModel):
    success: bool
    history: List[AnalysisHistoryItem]

class SingleAnalysisResponse(BaseModel):
    success: bool
    analysis: ImageAnalysisResponse

class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message")
    analysis_id: Optional[str] = Field(None, description="Optional analysis ID for context")

class ChatResponse(BaseModel):
    success: bool
    message: str
    role: str = "assistant"
