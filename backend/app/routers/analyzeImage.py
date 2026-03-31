from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from typing import Optional
from datetime import datetime
import numpy as np
import cv2
import base64

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


def generate_thumbnail_base64(annotated_image_base64):
    """Generate a small thumbnail from a base64 annotated image."""
    try:
        img_bytes = base64.b64decode(annotated_image_base64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is not None:
            thumbnail = cv2.resize(img, (200, 150))
            _, buffer = cv2.imencode('.jpg', thumbnail)
            return base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        print(f"Warning: Could not generate thumbnail: {e}")
    return ""


@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    session_id: Optional[str] = Query(None, description="Session ID to associate analysis with"),
):
    imageBytes = await file.read()

    npImage = np.frombuffer(imageBytes, np.uint8)
    cvImage = cv2.imdecode(npImage, cv2.IMREAD_COLOR)

    if cvImage is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    imgAnalysis = yolo_analyzer.extractStatistics(cvImage)
    yolo_analyzer.detections = imgAnalysis["detections"]

    # If session_id is provided, save to MongoDB
    if session_id:
        try:
            analytics_col = get_analytics_collection()
            sessions_col = get_sessions_collection()

            # Generate thumbnail for history display
            thumbnail = generate_thumbnail_base64(imgAnalysis["annotated_image"])

            analytics_doc = {
                "session_id": session_id,
                "analysis_id": imgAnalysis["analysis_id"],
                "timestamp": datetime.utcnow().isoformat(),
                "detections": imgAnalysis["detections"],
                "count": imgAnalysis["count"],
                "annotated_image": imgAnalysis["annotated_image"],
                "thumbnail": thumbnail,
                "statistics": imgAnalysis["statistics"],
                "is_duplicate": imgAnalysis.get("is_duplicate", False),
            }
            analytics_col.insert_one(analytics_doc)

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
    if session_id:
        try:
            analytics_col = get_analytics_collection()
            analyses = list(
                analytics_col.find({"session_id": session_id}).sort("timestamp", 1)
            )

            history = []
            for item in analyses:
                thumbnail = item.get("thumbnail", "")
                # If no thumbnail stored, generate one from annotated image
                if not thumbnail and item.get("annotated_image"):
                    thumbnail = generate_thumbnail_base64(item["annotated_image"])

                history.append(
                    {
                        "analysis_id": item["analysis_id"],
                        "timestamp": item.get("timestamp", ""),
                        "count": item.get("count", 0),
                        "thumbnail": thumbnail,
                        "statistics": item.get("statistics", {}),
                    }
                )

            return {"success": True, "history": history}
        except Exception as e:
            print(f"Warning: MongoDB history fetch failed: {e}")

    history = yolo_analyzer.get_history()
    return {"success": True, "history": history}


@router.get("/analysis/{analysis_id}", response_model=SingleAnalysisResponse)
async def get_analysis_by_id(
    analysis_id: str,
    session_id: Optional[str] = Query(None, description="Session ID"),
):
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