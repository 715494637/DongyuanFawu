from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.domains.auth.models import User
from app.domains.ai_kb.schemas import (
    AIKnowledgeBaseResponse,
    AIKnowledgeBaseUpdate,
    ChatRequest,
    ChatResponse,
    SpeechToTextResponse,
)
from app.domains.ai_kb.service import AIKnowledgeBaseService

router = APIRouter()
chat_router = APIRouter(tags=["AI聊天"])


@router.get("", response_model=AIKnowledgeBaseResponse)
async def get_ai_kb(db: AsyncSession = Depends(get_db)):
    ai_kb = await AIKnowledgeBaseService.get_ai_kb(db)
    return {"ai_kb": ai_kb}


@router.put("", response_model=AIKnowledgeBaseResponse)
async def update_ai_kb(
    data: AIKnowledgeBaseUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    ai_kb = await AIKnowledgeBaseService.update_ai_kb(
        db,
        data.ai_kb,
        current_admin.username
    )
    return {"ai_kb": ai_kb}


@chat_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    result = await AIKnowledgeBaseService.chat(request)
    return ChatResponse(**result)


@chat_router.post("/speech-to-text", response_model=SpeechToTextResponse)
async def speech_to_text(file: UploadFile = File(...)):
    """
    语音转文字接口（公开接口，无需登录）
    接受音频文件（webm/mp4/wav/ogg/m4a），返回识别文字。
    """
    allowed_types = {
        "audio/webm", "audio/mp4", "audio/wav", "audio/ogg",
        "audio/mpeg", "audio/m4a", "audio/x-m4a", "video/webm"
    }
    content_type = file.content_type or "audio/webm"
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"不支持的音频格式: {content_type}")

    audio_data = await file.read()
    if len(audio_data) == 0:
        raise HTTPException(status_code=400, detail="音频文件为空")

    result = await AIKnowledgeBaseService.speech_to_text(audio_data, content_type)
    return SpeechToTextResponse(**result)
