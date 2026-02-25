from fastapi import APIRouter, HTTPException
from app.services.chatbot import ChatService
from app.services.yoloAnalysis import yolo_analyzer
from app.models import ChatRequest, ChatResponse

router = APIRouter()
chatService = ChatService()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Get current analysis
        analysis_data = None
        if request.analysis_id:
            analysis_data = yolo_analyzer.get_analysis_by_id(request.analysis_id)

        # Get all analyses in session
        all_analyses = None
        if request.all_analysis_ids:
            all_analyses = []
            for analysis_id in request.all_analysis_ids:
                analysis = yolo_analyzer.get_analysis_by_id(analysis_id)
                if analysis:
                    all_analyses.append(analysis)

        response_message = chatService.chat(
            request.message,
            analysis_data,
            all_analyses
        )

        return ChatResponse(
            success=True,
            message=response_message,
            role="assistant"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.delete("/chat/history")
async def clearChatHistory():
    chatService.clearHistory()
    return {"success": True, "message": "Chat history cleared"}