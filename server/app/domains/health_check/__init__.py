"""
法务体检领域模块

提供法务体检题目的创建、查询、更新等功能
"""

from app.domains.health_check.service import HealthCheckService
from app.domains.health_check.router import router as health_check_router

__all__ = ["HealthCheckService", "health_check_router"]
