"""
应急预案领域模块

提供应急预案的创建、查询、更新等功能
"""

from app.domains.sops.service import SOPService
from app.domains.sops.router import router as sops_router

__all__ = ["SOPService", "sops_router"]
