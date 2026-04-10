"""
装修巡查领域 - API 路由

提供装修巡查记录的 CRUD API 端点
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core.dependencies import get_current_user
from app.domains.auth.models import User
from app.domains.renovation.schemas import (
    RenovationRecordCreate,
    RenovationRecordUpdate,
    RenovationRecordResponse,
)
from app.domains.renovation.service import RenovationService

router = APIRouter()


@router.get("", response_model=List[RenovationRecordResponse], tags=["装修巡查"])
async def get_renovation_records(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取当前用户的装修巡查记录列表"""
    records = await RenovationService.get_by_user(db, current_user.id)
    return [RenovationRecordResponse.model_validate(r) for r in records]


@router.get("/{record_id}", response_model=RenovationRecordResponse, tags=["装修巡查"])
async def get_renovation_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取单个装修巡查记录详情"""
    record = await RenovationService.get_by_id(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记录不存在"
        )
    return RenovationRecordResponse.model_validate(record)


@router.post("", response_model=RenovationRecordResponse, tags=["装修巡查"])
async def create_renovation_record(
    data: RenovationRecordCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """提交装修巡查记录"""
    record = await RenovationService.create(db, current_user.id, data)
    return RenovationRecordResponse.model_validate(record)


@router.put("/{record_id}", response_model=RenovationRecordResponse, tags=["装修巡查"])
async def update_renovation_record(
    record_id: str,
    data: RenovationRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新装修巡查记录"""
    record = await RenovationService.update(db, record_id, data)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记录不存在"
        )
    return RenovationRecordResponse.model_validate(record)


@router.delete("/{record_id}", tags=["装修巡查"])
async def delete_renovation_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除装修巡查记录"""
    if not await RenovationService.delete(db, record_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记录不存在"
        )
    return {"message": "删除成功"}
