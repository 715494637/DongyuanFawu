"""
联系二维码 API 路由模块

提供联系二维码的查询、创建和删除功能
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.domains.contact_qr.schemas import (
    ContactQRCodeCreate,
    ContactQRCode as ContactQRCodeSchema
)
from app.domains.contact_qr.service import ContactQRService
from app.core.dependencies import get_current_admin
from app.domains.auth.models import User

router = APIRouter()


@router.get("", response_model=List[ContactQRCodeSchema])
async def get_contact_qr(db: AsyncSession = Depends(get_db)):
    """
    获取所有联系二维码列表

    Args:
        db: 异步数据库会话

    Returns:
        List[ContactQRCode]: 联系二维码列表
    """
    return await ContactQRService.get_contact_qr(db)


@router.post("", response_model=ContactQRCodeSchema)
async def create_contact_qr(
    qr_data: ContactQRCodeCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    创建新的联系二维码（仅管理员）

    Args:
        qr_data: 二维码创建数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        ContactQRCode: 创建的二维码对象

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
    """
    return await ContactQRService.create_contact_qr(db, qr_data)


@router.delete("/{qr_id}")
async def delete_contact_qr(
    qr_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除联系二维码（仅管理员）

    Args:
        qr_id: 二维码ID
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 删除结果消息

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 二维码不存在时抛出 404 错误
    """
    await ContactQRService.delete_contact_qr(db, qr_id)
    return {"message": "二维码删除成功"}
