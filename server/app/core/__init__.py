"""
核心模块

导出认证和依赖注入功能，简化导入路径
"""

from app.core.auth import create_access_token, verify_token
from app.core.dependencies import (
    get_current_user,
    get_current_admin,
    get_current_approved_user,
    security
)

__all__ = [
    "create_access_token",
    "verify_token",
    "get_current_user",
    "get_current_admin",
    "get_current_approved_user",
    "security"
]