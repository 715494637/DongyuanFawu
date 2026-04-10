"""
装修巡查领域模块

提供装修巡查记录的创建、查询、更新等功能
"""

from app.domains.renovation.service import RenovationService
from app.domains.renovation.router import router as renovation_router

__all__ = ["RenovationService", "renovation_router"]
