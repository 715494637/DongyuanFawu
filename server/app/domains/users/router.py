"""
用户管理领域 - API 路由

提供用户查询、更新、审批、删除等管理端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.domains.auth.models import User
from app.domains.auth.schemas import UserResponse, UserUpdate, AdminUserCreate, QuotaUpdate
from app.domains.users.service import UserService

router = APIRouter()


@router.get("/me", response_model=UserResponse, tags=["用户管理"])
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    获取当前登录用户信息

    API 兼容性：路径 /api/v1/users/me 保持不变
    """
    return UserResponse.model_validate(current_user)


@router.post("", response_model=UserResponse, tags=["用户管理"])
async def create_user_by_admin(
    user_data: AdminUserCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    管理员创建用户

    Args:
        user_data: 用户创建数据（用户名、密码、角色等）
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        UserResponse: 创建的用户信息
    """
    user = await UserService.create_user_by_admin(db, user_data)
    return UserResponse.model_validate(user)


@router.get("/stats/overview", tags=["用户管理"])
async def get_user_stats_overview(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户统计概览（管理员）

    API 兼容性：路径 /api/v1/users/stats/overview 保持不变

    返回:
        - total_users: 总用户数
        - approved_users: 已审批用户数
        - pending_users: 待审批用户数
        - admin_users: 管理员数量
        - regular_users: 普通用户数量
    """
    stats = await UserService.get_user_stats(db)
    return stats


@router.get("", response_model=list[UserResponse], tags=["用户管理"])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户列表（管理员，支持分页）

    API 兼容性：路径 /api/v1/users 保持不变

    Query 参数:
        skip: 跳过的记录数，默认 0
        limit: 返回的最大记录数，默认 100
    """
    users = await UserService.get_all_users(db, skip=skip, limit=limit)
    return [UserResponse.model_validate(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse, tags=["用户管理"])
async def get_user(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取指定用户信息（管理员）

    API 兼容性：路径 /api/v1/users/{user_id} 保持不变
    """
    user = await UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    return UserResponse.model_validate(user)


@router.put("/{user_id}/approve", tags=["用户管理"])
async def approve_user(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    审批用户（管理员）

    API 兼容性：路径 /api/v1/users/{user_id}/approve 保持不变
    """
    await UserService.approve_user(db, user_id)
    return {"message": "用户审批成功"}


@router.put("/{user_id}/quota", response_model=UserResponse, tags=["用户管理"])
async def update_user_quota(
    user_id: str,
    quota_data: QuotaUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新用户额度（管理员）

    Args:
        user_id: 用户ID
        quota_data: 额度更新数据（operation, lawyer_letters, consultations）
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        UserResponse: 更新后的用户信息
    """
    user = await UserService.update_user_quota(db, user_id, quota_data)
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse, tags=["用户管理"])
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    更新用户信息

    API 兼容性：路径 /api/v1/users/{user_id} 保持不变
    """
    is_admin = current_user.role == "ADMIN"
    updated_user = await UserService.update_user(db, user_id, user_data, is_admin)
    return UserResponse.model_validate(updated_user)


@router.delete("/{user_id}", tags=["用户管理"])
async def delete_user(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除用户（管理员）

    API 兼容性：路径 /api/v1/users/{user_id} (DELETE) 保持不变
    """
    await UserService.delete_user(db, user_id)
    return {"message": "用户删除成功"}