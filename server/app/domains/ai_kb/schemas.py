from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# AI知识库 schemas
class AIKnowledgeBaseResponse(BaseModel):
    """AI知识库响应模型"""
    ai_kb: str = Field(..., description="AI知识库内容")

    model_config = ConfigDict(from_attributes=True)


class AIKnowledgeBaseUpdate(BaseModel):
    """AI知识库更新模型"""
    ai_kb: str = Field(..., description="AI知识库内容")


class ChatMessage(BaseModel):
    """聊天消息模型"""
    role: str = Field(..., description="角色: user 或 model")
    content: str = Field(..., description="消息内容")


class ChatRequest(BaseModel):
    """AI聊天请求模型"""
    message: str = Field(..., description="用户消息")
    history: Optional[List[ChatMessage]] = Field(default=None, description="聊天历史")


class ChatResponse(BaseModel):
    """AI聊天响应模型"""
    response: str = Field(..., description="AI回复内容")
    model: str = Field(default="qwen3.6-plus", description="使用的模型")
    error: Optional[str] = Field(default=None, description="错误信息（如果有）")
    error_code: Optional[str] = Field(default=None, description="错误代码")

class SpeechToTextResponse(BaseModel):
    """语音转文字响应模型"""
    text: str = Field(..., description="识别出的文字内容")
    error: Optional[str] = Field(default=None, description="错误信息（如果有）")

