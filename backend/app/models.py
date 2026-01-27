from pydantic import BaseModel, Field
from typing import List

class ImageAnalysisResponse(BaseModel):
    success: bool = Field(..., description="Indicates if the analysis was successful")
    detections: List[dict] = Field(..., description="List of detected objects with their statistics")
    count: int = Field(..., description="Total number of detected objects")

class MostProminentResponse(BaseModel):
    success: bool = Field(..., description="Indicates if the retrieval was successful")
    most_prominent: dict = Field(..., description="Details of the most prominent detected object")


