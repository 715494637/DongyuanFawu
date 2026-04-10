"""
AI知识库 领域模块

提供AI知识库的管理功能
"""

from app.domains.ai_kb.service import AIKnowledgeBaseService
from app.domains.ai_kb.router import router as ai_kb_router, chat_router

__all__ = ["AIKnowledgeBaseService", "ai_kb_router", "chat_router"]
