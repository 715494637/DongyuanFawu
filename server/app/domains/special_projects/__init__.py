"""
专项服务领域模块

提供专项服务的创建、查询、更新等功能
"""

from app.domains.special_projects.service import SpecialProjectService
from app.domains.special_projects.router import router as special_projects_router

__all__ = ["SpecialProjectService", "special_projects_router"]
