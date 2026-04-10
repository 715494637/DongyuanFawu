"""
文档领域模块

提供文档模板的查询、创建、更新和删除功能
"""

from app.domains.documents.service import DocumentService
from app.domains.documents.router import router as documents_router

__all__ = ["DocumentService", "documents_router"]
