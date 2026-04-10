"""
证据清单领域 - API 路由

提供证据清单的查询、创建、更新和删除功能
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core import get_current_admin
from app.domains.auth.models import User
from app.domains.evidence.schemas import EvidenceListCreate, EvidenceListResponse
from app.domains.evidence.service import EvidenceService

router = APIRouter()


@router.get("", response_class=JSONResponse, response_model=None)
async def get_evidence(db: AsyncSession = Depends(get_db)):
    """
    获取所有证据清单列表

    Args:
        db: 异步数据库会话

    Returns:
        JSONResponse: 证据清单列表
    """
    return JSONResponse(content=await EvidenceService.get_evidence(db))


@router.post("")
async def create_evidence(
    evidence_data: EvidenceListCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    创建新的证据清单（仅管理员）

    Args:
        evidence_data: 证据清单创建数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        EvidenceList: 创建的证据清单对象

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
    """
    return await EvidenceService.create_evidence(db, evidence_data)


@router.put("/{evidence_id}")
async def update_evidence(
    evidence_id: str,
    evidence_data: EvidenceListCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新证据清单（仅管理员）

    Args:
        evidence_id: 证据清单ID
        evidence_data: 更新数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        EvidenceList: 更新后的证据清单对象

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 证据清单不存在时抛出 404 错误
    """
    return await EvidenceService.update_evidence(db, evidence_id, evidence_data)


@router.delete("/{evidence_id}")
async def delete_evidence(
    evidence_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除证据清单（仅管理员）

    Args:
        evidence_id: 证据清单ID
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 删除结果消息

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 证据清单不存在时抛出 404 错误
    """
    await EvidenceService.delete_evidence(db, evidence_id)
    return {"message": "证据清单删除成功"}
