"""
认证依赖注入模块（异步版本）

提供获取当前用户、管理员和已审批用户的依赖注入函数
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db import get_db  # 这个会返回正确的会话类型
from app.domains.auth.models import User
from app.core.auth import verify_token

# HTTP Bearer 认证方案
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    获取当前认证用户的依赖注入（异步）

    Args:
        credentials: HTTP认证凭据
        db: 异步数据库会话

    Returns:
        User: 当前认证用户

    Raises:
        HTTPException: 认证失败时抛出 401 错误
    """
    token = credentials.credentials
    token_data = verify_token(token)

    result = await db.execute(select(User).where(User.id == token_data["sub"]))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在"
        )

    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    获取当前管理员用户的依赖注入（异步）

    Args:
        current_user: 当前认证用户

    Returns:
        User: 当前管理员用户

    Raises:
        HTTPException: 非管理员用户时抛出 403 错误
    """
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，需要管理员权限"
        )

    return current_user


async def get_current_approved_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    获取当前已审批用户的依赖注入（异步）

    Args:
        current_user: 当前认证用户

    Returns:
        User: 当前已审批用户

    Raises:
        HTTPException: 用户未审批时抛出 403 错误
    """
    if current_user.role != "ADMIN" and current_user.approval_status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号未通过审批"
        )

    return current_user
