"""
物业公司领域模块

提供物业公司的查询、创建和删除功能
"""

from app.domains.enterprises.service import EnterpriseService
from app.domains.enterprises.router import router as enterprises_router

__all__ = ["EnterpriseService", "enterprises_router"]
