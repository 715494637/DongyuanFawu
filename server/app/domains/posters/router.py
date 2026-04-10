"""
海报领域 - API 路由
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core.dependencies import get_current_admin
from app.domains.auth.models import User
from app.domains.posters.schemas import (
    CustomPosterCreate,
    CustomPosterResponse,
)
from app.domains.posters.service import PosterService

router = APIRouter()


@router.get("", response_model=List[CustomPosterResponse], tags=["自定义海报"])
async def get_posters(db: AsyncSession = Depends(get_db)):
    """
    获取所有自定义海报列表

    Args:
        db: 异步数据库会话

    Returns:
        List[CustomPosterResponse]: 自定义海报列表
    """
    posters = await PosterService.get_posters(db)
    return [CustomPosterResponse.model_validate(p) for p in posters]


@router.post("", response_model=CustomPosterResponse, tags=["自定义海报"])
async def create_poster(
    poster_data: CustomPosterCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    创建新的自定义海报（仅管理员）

    Args:
        poster_data: 海报创建数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        CustomPosterResponse: 创建的海报对象

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
    """
    poster = await PosterService.create_poster(db, poster_data)
    return CustomPosterResponse.model_validate(poster)


@router.delete("/{poster_id}", tags=["自定义海报"])
async def delete_poster(
    poster_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除海报（仅管理员）

    Args:
        poster_id: 海报ID
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 删除结果消息

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 海报不存在时抛出 404 错误
    """
    await PosterService.delete_poster(db, poster_id)
    return {"message": "海报删除成功"}
