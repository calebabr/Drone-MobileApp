from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from typing import Optional
from datetime import datetime
import numpy as np
import cv2

from app.services.yoloAnalysis import yolo_analyzer
from app.services.database import get_sessions_collection, get_analytics_collection
from bson import ObjectId

from app.models import (
    ImageAnalysisResponse,
    MostProminentResponse,
    AnalysisHistoryResponse,
    SingleAnalysisResponse,
)

router = APIRouter()


@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    session_id: Optional[str] = Query(None, description="Session ID to associate analysis with"),
):
    """
    Analyze an uploaded image, convert to OpenCV format and return detailed analysis
    with annotated image and statistics. Optionally associate with a MongoDB session.
    """
    imageBytes = await file.read()

    # Image to OpenCV
    npImage = np.frombuffer(imageBytes, np.uint8)
    cvImage = cv2.imdecode(npImage, cv2.IMREAD_COLOR)

    if cvImage is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Pass OpenCV image to service
    imgAnalysis = yolo_analyzer.extractStatistics(cvImage)
    yolo_analyzer.detections = imgAnalysis["detections"]

    # If session_id is provided, save to MongoDB
    if session_id:
        try:
            analytics_col = get_analytics_collection()
            sessions_col = get_sessions_collection()

            # Save analysis to analytics collection
            analytics_doc = {
                "session_id": session_id,
                "analysis_id": imgAnalysis["analysis_id"],
                "timestamp": datetime.utcnow().isoformat(),
                "detections": imgAnalysis["detections"],
                "count": imgAnalysis["count"],
                "annotated_image": imgAnalysis["annotated_image"],
                "statistics": imgAnalysis["statistics"],
                "is_duplicate": imgAnalysis.get("is_duplicate", False),
            }
            analytics_col.insert_one(analytics_doc)

            # Update session with analysis reference
            sessions_col.update_one(
                {"_id": ObjectId(session_id)},
                {
                    "$push": {"analysis_ids": imgAnalysis["analysis_id"]},
                    "$set": {"updated_at": datetime.utcnow().isoformat()},
                },
            )
        except Exception as e:
            print(f"Warning: Could not save to MongoDB: {e}")

    return imgAnalysis


@router.get("/most-prominent-object", response_model=MostProminentResponse)
async def get_most_prominent_object():
    """
    Retrieve the most prominent detected object from the last analyzed image.
    """
    if not yolo_analyzer.detections:
        raise HTTPException(
            status_code=404,
            detail="No detections available. Please analyze an image first.",
        )

    mostProminent = yolo_analyzer.getMostProminent(yolo_analyzer.detections)

    return mostProminent


@router.get("/analysis-history", response_model=AnalysisHistoryResponse)
async def get_analysis_history(
    session_id: Optional[str] = Query(None, description="Session ID to get history for"),
):
    """
    Retrieve the history of all image analyses. If session_id is provided,
    fetches from MongoDB; otherwise uses in-memory history.
    """
    if session_id:
        try:
            analytics_col = get_analytics_collection()
            analyses = list(
                analytics_col.find({"session_id": session_id}).sort("timestamp", 1)
            )

            history = []
            for item in analyses:
                # Generate a thumbnail from the annotated image if not present
                thumbnail = item.get("thumbnail", "")
                if not thumbnail and item.get("annotated_image"):
                    # Use first 100 chars as a placeholder — the frontend
                    # already handles base64 thumbnails
                    thumbnail = item["annotated_image"][:200]

                history.append(
                    {
                        "analysis_id": item["analysis_id"],
                        "timestamp": item.get("timestamp", ""),
                        "count": item.get("count", 0),
                        "thumbnail": item.get("thumbnail", thumbnail),
                        "statistics": item.get("statistics", {}),
                    }
                )

            return {"success": True, "history": history}
        except Exception as e:
            print(f"Warning: MongoDB history fetch failed: {e}")

    # Fallback to in-memory history
    history = yolo_analyzer.get_history()
    return {"success": True, "history": history}


@router.get("/analysis/{analysis_id}", response_model=SingleAnalysisResponse)
async def get_analysis_by_id(
    analysis_id: str,
    session_id: Optional[str] = Query(None, description="Session ID"),
):
    """
    Retrieve a specific analysis by its ID. Checks MongoDB first if session_id provided.
    """
    if session_id:
        try:
            analytics_col = get_analytics_collection()
            doc = analytics_col.find_one(
                {"session_id": session_id, "analysis_id": analysis_id}
            )
            if doc:
                return {
                    "success": True,
                    "analysis": {
                        "success": True,
                        "detections": doc["detections"],
                        "count": doc["count"],
                        "annotated_image": doc["annotated_image"],
                        "statistics": doc["statistics"],
                        "analysis_id": doc["analysis_id"],
                        "is_duplicate": doc.get("is_duplicate", False),
                    },
                }
        except Exception as e:
            print(f"Warning: MongoDB analysis fetch failed: {e}")

    # Fallback to in-memory
    analysis = yolo_analyzer.get_analysis_by_id(analysis_id)

    if analysis is None:
        raise HTTPException(
            status_code=404, detail=f"Analysis with ID {analysis_id} not found"
        )

    return {"success": True, "analysis": analysis}


@router.delete("/analysis-history")
async def clear_analysis_history(
    session_id: Optional[str] = Query(None, description="Session ID"),
):
    """
    Clear all analysis history. If session_id is provided, clears from MongoDB too.
    """
    if session_id:
        try:
            analytics_col = get_analytics_collection()
            sessions_col = get_sessions_collection()

            analytics_col.delete_many({"session_id": session_id})
            sessions_col.update_one(
                {"_id": ObjectId(session_id)},
                {
                    "$set": {
                        "analysis_ids": [],
                        "image_hashes": [],
                        "updated_at": datetime.utcnow().isoformat(),
                    }
                },
            )
        except Exception as e:
            print(f"Warning: MongoDB clear failed: {e}")

    result = yolo_analyzer.clear_history()
    return result