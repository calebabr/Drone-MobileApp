from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from bson import ObjectId

from app.services.chatbot import ChatService
from app.services.yoloAnalysis import yolo_analyzer
from app.services.database import get_sessions_collection, get_analytics_collection
from app.models import ChatRequest, ChatResponse

router = APIRouter()
chatService = ChatService()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Get current analysis
        analysis_data = None
        all_analyses = None

        if request.session_id:
            # Session-aware: load from MongoDB
            analytics_col = get_analytics_collection()
            sessions_col = get_sessions_collection()

            if request.analysis_id:
                doc = analytics_col.find_one(
                    {
                        "session_id": request.session_id,
                        "analysis_id": request.analysis_id,
                    }
                )
                if doc:
                    analysis_data = {
                        "analysis_id": doc["analysis_id"],
                        "detections": doc["detections"],
                        "count": doc["count"],
                        "statistics": doc["statistics"],
                    }

            # Get all analyses for this session
            if request.all_analysis_ids:
                all_analyses = []
                for aid in request.all_analysis_ids:
                    doc = analytics_col.find_one(
                        {"session_id": request.session_id, "analysis_id": aid}
                    )
                    if doc:
                        all_analyses.append(
                            {
                                "analysis_id": doc["analysis_id"],
                                "timestamp": doc.get("timestamp", ""),
                                "detections": doc["detections"],
                                "count": doc["count"],
                                "statistics": doc["statistics"],
                            }
                        )

            # Load stored chat history from session
            session_doc = sessions_col.find_one(
                {"_id": ObjectId(request.session_id)}
            )
            stored_history = session_doc.get("chat_history", []) if session_doc else []

            # Use session-aware chat
            response_message = chatService.chat_with_history(
                request.message, stored_history, analysis_data, all_analyses
            )

            # Save new messages to MongoDB session
            new_messages = [
                {"role": "user", "content": request.message},
                {"role": "assistant", "content": response_message},
            ]
            sessions_col.update_one(
                {"_id": ObjectId(request.session_id)},
                {
                    "$push": {"chat_history": {"$each": new_messages}},
                    "$set": {"updated_at": datetime.utcnow().isoformat()},
                },
            )

        else:
            # Legacy in-memory mode (no session)
            if request.analysis_id:
                analysis_data = yolo_analyzer.get_analysis_by_id(request.analysis_id)

            if request.all_analysis_ids:
                all_analyses = []
                for analysis_id in request.all_analysis_ids:
                    analysis = yolo_analyzer.get_analysis_by_id(analysis_id)
                    if analysis:
                        all_analyses.append(analysis)

            response_message = chatService.chat(
                request.message, analysis_data, all_analyses
            )

        return ChatResponse(
            success=True, message=response_message, role="assistant"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.delete("/chat/history")
async def clearChatHistory(
    session_id: Optional[str] = Query(None, description="Session ID"),
):
    """Clear chat history. If session_id is provided, clears from MongoDB too."""
    if session_id:
        try:
            sessions_col = get_sessions_collection()
            sessions_col.update_one(
                {"_id": ObjectId(session_id)},
                {
                    "$set": {
                        "chat_history": [],
                        "updated_at": datetime.utcnow().isoformat(),
                    }
                },
            )
        except Exception as e:
            print(f"Warning: MongoDB chat clear failed: {e}")

    chatService.clearHistory()
    return {"success": True, "message": "Chat history cleared"}