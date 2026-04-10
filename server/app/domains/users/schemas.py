"""
用户管理领域 - Pydantic Schema

定义用户管理相关的 Schema（扩展开认证 schema）
"""

from app.domains.auth.schemas import UserUpdate, UserResponse

# 重新导出共享的 Schema
__all__ = ["UserUpdate", "UserResponse"]