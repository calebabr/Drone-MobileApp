from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from bson import ObjectId

from app.services.chatbot import ChatService
from app.services.yoloAnalysis import yolo_analyzer
from app.services.database import get_sessions_collection, get_analytics_collection
from app.models import ChatRequest, ChatResponse, UniversalChatRequest

router = APIRouter()
chatService = ChatService()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        analysis_data = None
        all_analyses = None

        if request.session_id:
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


@router.post("/chat/universal", response_model=ChatResponse)
async def universal_chat(request: UniversalChatRequest):
    """Universal chatbot that has access to all sessions' data."""
    try:
        analytics_col = get_analytics_collection()
        sessions_col = get_sessions_collection()

        # Gather data from ALL sessions
        all_sessions = list(sessions_col.find().sort("created_at", 1))
        all_analyses = list(analytics_col.find().sort("timestamp", 1))

        # Build a comprehensive context
        context_parts = []
        context_parts.append(f"Total sessions: {len(all_sessions)}")
        context_parts.append(f"Total analyses across all sessions: {len(all_analyses)}")

        for i, session in enumerate(all_sessions):
            sid = str(session["_id"])
            session_analyses = [a for a in all_analyses if a.get("session_id") == sid]
            chat_count = len(session.get("chat_history", []))

            context_parts.append(f"\n--- Session {i+1} (ID: {sid[:8]}...) ---")
            context_parts.append(f"  Created: {session.get('created_at', 'unknown')}")
            context_parts.append(f"  Analyses: {len(session_analyses)}, Chat messages: {chat_count}")

            for j, analysis in enumerate(session_analyses):
                stats = analysis.get("statistics", {})
                class_dist = stats.get("class_distribution", {})
                detections = analysis.get("detections", [])

                context_parts.append(f"  Analysis {j+1} (ID: {analysis.get('analysis_id', '?')}):")
                context_parts.append(f"    Objects: {analysis.get('count', 0)}, Classes: {class_dist}")
                context_parts.append(f"    Avg confidence: {stats.get('average_confidence', 0):.2%}")
                context_parts.append(f"    Coverage: {stats.get('coverage_percentage', 0):.2f}%")

                # Include detection details
                for d in detections[:5]:  # Limit to first 5 per analysis
                    context_parts.append(
                        f"    - {d['class_name']}: conf {d['confidence']:.2%}, "
                        f"area {d['pixelArea']:.0f}px², score {d['score']:.3f}, "
                        f"distance (X:{d['distance']['x']:.2f}m, Y:{d['distance']['y']:.2f}m, Z:{d['distance']['z']:.2f}m)"
                    )
                if len(detections) > 5:
                    context_parts.append(f"    ... and {len(detections) - 5} more detections")

        context_string = "\n".join(context_parts)

        # Load universal chat history
        # We store universal chat in a special document
        universal_doc = sessions_col.find_one({"_type": "universal_chat"})
        if not universal_doc:
            sessions_col.insert_one({
                "_type": "universal_chat",
                "chat_history": [],
                "created_at": datetime.utcnow().isoformat(),
            })
            universal_doc = sessions_col.find_one({"_type": "universal_chat"})

        stored_history = universal_doc.get("chat_history", [])

        # Build system prompt for universal chat
        system_prompt = f"""You are an AI assistant with access to ALL drone image analysis sessions.
You can answer questions about any session, compare sessions, identify trends across sessions,
and provide insights from the complete analysis history.

COMPLETE DATA ACROSS ALL SESSIONS:
{context_string}

Be concise and helpful. Reference specific session numbers or analysis IDs when relevant."""

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(stored_history)
        messages.append({"role": "user", "content": request.message})

        response = chatService.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )

        assistant_message = response.choices[0].message.content

        # Save to universal chat history
        new_messages = [
            {"role": "user", "content": request.message},
            {"role": "assistant", "content": assistant_message},
        ]
        sessions_col.update_one(
            {"_type": "universal_chat"},
            {"$push": {"chat_history": {"$each": new_messages}}},
        )

        return ChatResponse(
            success=True, message=assistant_message, role="assistant"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Universal chat error: {str(e)}")


@router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a specific session."""
    try:
        sessions_col = get_sessions_collection()
        session_doc = sessions_col.find_one({"_id": ObjectId(session_id)})

        if not session_doc:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "success": True,
            "chat_history": session_doc.get("chat_history", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/chat/history/universal/all")
async def get_universal_chat_history():
    """Get universal chat history."""
    try:
        sessions_col = get_sessions_collection()
        universal_doc = sessions_col.find_one({"_type": "universal_chat"})

        return {
            "success": True,
            "chat_history": universal_doc.get("chat_history", []) if universal_doc else [],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.delete("/chat/history")
async def clearChatHistory(
    session_id: Optional[str] = Query(None, description="Session ID"),
):
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


@router.delete("/chat/history/universal")
async def clear_universal_chat_history():
    """Clear universal chat history."""
    try:
        sessions_col = get_sessions_collection()
        sessions_col.update_one(
            {"_type": "universal_chat"},
            {"$set": {"chat_history": []}},
        )
        return {"success": True, "message": "Universal chat history cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")