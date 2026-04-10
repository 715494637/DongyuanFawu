"""
东元法物后端应用主模块

导出核心组件和配置，简化导入路径
"""

# 导出配置和数据库
from app.config import settings, async_engine, init_db, close_db

# 导出核心功能
from app.core import (
    create_access_token,
    verify_token,
    get_current_user,
    get_current_admin,
    get_current_approved_user
)

# 导出数据库会话
from app.db import get_db

# 导出日志工具
from app.utils import logger, setup_logging

__all__ = [
    # 配置和数据库
    "settings",
    "async_engine",
    "init_db",
    "close_db",
    # 核心功能
    "create_access_token",
    "verify_token",
    "get_current_user",
    "get_current_admin",
    "get_current_approved_user",
    # 数据库会话
    "get_db",
    # 日志工具
    "logger",
    "setup_logging",
]