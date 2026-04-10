"""
物业公司领域 - API 路由
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core.dependencies import get_current_admin
from app.domains.auth.models import User
from app.domains.enterprises.schemas import EnterpriseCreate
from app.domains.enterprises.service import EnterpriseService

router = APIRouter()


@router.get("", response_model=List[str])
async def get_enterprises(db: AsyncSession = Depends(get_db)):
    """
    获取所有物业公司名称列表

    Args:
        db: 异步数据库会话

    Returns:
        List[str]: 物业公司名称列表
    """
    return await EnterpriseService.get_enterprises(db)


@router.post("")
async def create_enterprise(
    enterprise: EnterpriseCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    添加新的物业公司（仅管理员）

    Args:
        enterprise: 物业公司创建数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 添加结果消息

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 物业公司已存在时抛出 400 错误
    """
    await EnterpriseService.create_enterprise(db, enterprise)
    return {"message": "物业公司添加成功"}


@router.delete("/{name}")
async def delete_enterprise(
    name: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除物业公司（仅管理员）

    Args:
        name: 物业公司名称
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 删除结果消息

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 物业公司不存在时抛出 404 错误
    """
    await EnterpriseService.delete_enterprise(db, name)
    return {"message": "物业公司删除成功"}
