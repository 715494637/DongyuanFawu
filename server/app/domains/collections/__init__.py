"""
催收记录领域模块

提供催收记录的创建、查询、更新等功能
"""

from app.domains.collections.service import CollectionService
from app.domains.collections.router import router as collections_router

__all__ = ["CollectionService", "collections_router"]