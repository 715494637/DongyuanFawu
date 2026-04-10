"""
风险场景领域模块

提供风险场景的创建、查询、更新和删除等功能
"""

from app.domains.risks.service import RiskService
from app.domains.risks.router import router as risks_router

__all__ = ["RiskService", "risks_router"]
