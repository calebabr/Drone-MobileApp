from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from bson import ObjectId
from app.services.database import get_sessions_collection, get_analytics_collection
from app.models import (
    CreateSessionResponse,
    SessionListResponse,
    SessionSummaryResponse,
    SessionItem,
)
from app.services.chatbot import ChatService

router = APIRouter(prefix="/sessions", tags=["sessions"])

# Dedicated summarizer instance (not tied to any session)
summary_chat_service = ChatService()


@router.post("/create", response_model=CreateSessionResponse)
async def create_session():
    """Create a new session."""
    sessions_col = get_sessions_collection()

    session_doc = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "analysis_ids": [],
        "chat_history": [],
        "image_hashes": [],
    }

    result = sessions_col.insert_one(session_doc)
    session_id = str(result.inserted_id)

    return CreateSessionResponse(
        success=True,
        session_id=session_id,
        message="New session created",
    )


@router.get("/list", response_model=SessionListResponse)
async def list_sessions():
    """List all sessions, sorted by most recent."""
    sessions_col = get_sessions_collection()
    analytics_col = get_analytics_collection()

    cursor = sessions_col.find({"_type": {"$exists": False}}).sort("created_at", -1)

    sessions = []
    for doc in cursor:
        analyses = list(
            analytics_col.find(
                {"session_id": str(doc["_id"])},
                {"statistics.class_distribution": 1},
            )
        )
        analysis_count = len(analyses)

        # Aggregate class counts across all analyses
        class_totals = {}
        for analysis in analyses:
            dist = analysis.get("statistics", {}).get("class_distribution", {})
            for cls, count in dist.items():
                class_totals[cls] = class_totals.get(cls, 0) + count

        top_objects = None
        if class_totals:
            top = sorted(class_totals.items(), key=lambda x: x[1], reverse=True)[:4]
            top_objects = ", ".join(f"{count} {cls}" for cls, count in top)

        sessions.append(
            SessionItem(
                session_id=str(doc["_id"]),
                created_at=doc["created_at"],
                updated_at=doc["updated_at"],
                analysis_count=analysis_count,
                chat_message_count=len(doc.get("chat_history", [])),
                top_objects=top_objects,
            )
        )

    return SessionListResponse(success=True, sessions=sessions)


@router.get("/summary/{session_id}", response_model=SessionSummaryResponse)
async def get_session_summary(session_id: str):
    """Generate an AI summary of a past session."""
    sessions_col = get_sessions_collection()
    analytics_col = get_analytics_collection()

    try:
        session_doc = sessions_col.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")

    # Gather all analytics for this session
    analyses = list(analytics_col.find({"session_id": session_id}))

    if not analyses and not session_doc.get("chat_history"):
        return SessionSummaryResponse(
            success=True,
            session_id=session_id,
            summary="This session has no analyses or chat history yet. It's a fresh session ready for new drone image analysis.",
            analysis_count=0,
            chat_message_count=0,
        )

    # Build a context string for the AI
    context_parts = []
    context_parts.append(f"Session created: {session_doc['created_at']}")
    context_parts.append(f"Last updated: {session_doc['updated_at']}")
    context_parts.append(f"Total analyses: {len(analyses)}")

    for i, analysis in enumerate(analyses):
        stats = analysis.get("statistics", {})
        class_dist = stats.get("class_distribution", {})
        context_parts.append(
            f"\nAnalysis {i+1} (ID: {analysis.get('analysis_id', 'unknown')}):"
        )
        context_parts.append(f"  - Timestamp: {analysis.get('timestamp', 'unknown')}")
        context_parts.append(f"  - Objects detected: {analysis.get('count', 0)}")
        context_parts.append(f"  - Classes found: {class_dist}")
        context_parts.append(
            f"  - Avg confidence: {stats.get('average_confidence', 0):.2%}"
        )
        context_parts.append(
            f"  - Coverage: {stats.get('coverage_percentage', 0):.2f}%"
        )

    chat_history = session_doc.get("chat_history", [])
    if chat_history:
        context_parts.append(f"\nChat messages exchanged: {len(chat_history)}")
        # Include last few messages for context
        recent_msgs = chat_history[-6:]
        context_parts.append("Recent chat messages:")
        for msg in recent_msgs:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")[:150]
            context_parts.append(f"  [{role}]: {content}")

    context_string = "\n".join(context_parts)

    # Use the chatbot to generate a summary
    summary_prompt = f"""Summarize the following drone image analysis session in 2-3 sentences. 
Focus on what was analyzed, key findings, and the types of objects detected.
Be concise and informative.

Session Data:
{context_string}"""

    try:
        summary = summary_chat_service.generate_summary(summary_prompt)
    except Exception:
        summary = f"Session contains {len(analyses)} analyses with {len(chat_history)} chat messages. Created on {session_doc['created_at']}."

    return SessionSummaryResponse(
        success=True,
        session_id=session_id,
        summary=summary,
        analysis_count=len(analyses),
        chat_message_count=len(chat_history),
    )


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and all its analytics."""
    sessions_col = get_sessions_collection()
    analytics_col = get_analytics_collection()

    try:
        result = sessions_col.delete_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    # Also delete all analytics for this session
    analytics_col.delete_many({"session_id": session_id})

    return {"success": True, "message": "Session and associated data deleted"}