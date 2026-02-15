from fastapi import APIRouter, HTTPException
from app.services.chatbot import ChatBot
from app.services.yoloAnalysis import YoloAnalysis
from app.models import ChatRequest, ChatResponse

router = APIRouter()
chatService = ChatBot()
yoloAnalyzer = YoloAnalysis()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to the AI chatbot.
    Optionally include analysis_id to give the AI context about the current image.
    """
    try:
        analysis_data = None
        if request.analysis_id:
            analysis_data = yoloAnalyzer.get_analysis_by_id(request.analysis_id)

        response_message = chatService.chat(request.message, analysis_data)

        return ChatResponse(
            success=True,
            message=response_message,
            role="assistant"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.delete("/chat/history")
async def clearChatHistory():
    """Clear the conversation history"""
    chatService.clearHistory()
    return {"success": True, "message": "Chat history cleared"}