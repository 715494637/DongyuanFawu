"""
用户管理领域模块

提供用户查询、更新、审核等管理功能
"""

from app.domains.users.service import UserService
from app.domains.users.router import router as users_router

__all__ = ["UserService", "users_router"]
