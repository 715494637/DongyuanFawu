"""
话术库领域模块

提供话术库的创建、查询、更新等功能
"""

from app.domains.scripts.service import ScriptService
from app.domains.scripts.router import router as scripts_router, collection_router

__all__ = ["ScriptService", "scripts_router", "collection_router"]
