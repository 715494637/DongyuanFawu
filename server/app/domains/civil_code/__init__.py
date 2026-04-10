"""
民法典领域模块

提供民法典条文的查询、创建、更新和删除功能
"""

from app.domains.civil_code.service import CivilCodeService
from app.domains.civil_code.router import router as civil_code_router

__all__ = ["CivilCodeService", "civil_code_router"]
