"""
系统配置 领域模块

提供系统配置的管理功能
"""

from app.domains.config.service import ConfigService
from app.domains.config.router import router as config_router

__all__ = ["ConfigService", "config_router"]
