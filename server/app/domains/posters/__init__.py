"""
海报领域模块

提供自定义海报的创建、查询和删除等功能
"""

from app.domains.posters.service import PosterService
from app.domains.posters.router import router as posters_router

__all__ = ["PosterService", "posters_router"]
