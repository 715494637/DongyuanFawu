"""
民法典领域 - API 路由
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core.dependencies import get_current_admin
from app.domains.auth.models import User
from app.domains.civil_code.schemas import (
    CivilCodeArticleCreate,
    CivilCodeArticleResponse,
)
from app.domains.civil_code.service import CivilCodeService

router = APIRouter()


@router.get("", response_model=List[CivilCodeArticleResponse], tags=["民法典"])
async def get_civil_code(db: AsyncSession = Depends(get_db)):
    """
    获取所有民法典条文列表

    Args:
        db: 异步数据库会话

    Returns:
        List[CivilCodeArticle]: 民法典条文列表
    """
    return await CivilCodeService.get_civil_code(db)


@router.post(
    "",
    response_model=CivilCodeArticleResponse,
    tags=["民法典"]
)
async def create_civil_code(
    article_data: CivilCodeArticleCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    创建新的民法典条文（仅管理员）

    Args:
        article_data: 民法典条文创建数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        CivilCodeArticle: 创建的民法典条文对象

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
    """
    return await CivilCodeService.create_civil_code(db, article_data)


@router.put(
    "/{article_id}",
    response_model=CivilCodeArticleResponse,
    tags=["民法典"]
)
async def update_civil_code(
    article_id: str,
    article_data: CivilCodeArticleCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新民法典条文（仅管理员）

    Args:
        article_id: 民法典条文ID
        article_data: 更新数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        CivilCodeArticle: 更新后的民法典条文对象

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 民法典条文不存在时抛出 404 错误
    """
    return await CivilCodeService.update_civil_code(db, article_id, article_data)


@router.delete("/{article_id}", tags=["民法典"])
async def delete_civil_code(
    article_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除民法典条文（仅管理员）

    Args:
        article_id: 民法典条文ID
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 删除结果消息

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 民法典条文不存在时抛出 404 错误
    """
    await CivilCodeService.delete_civil_code(db, article_id)
    return {"message": "民法典条文删除成功"}
