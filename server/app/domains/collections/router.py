"""
催收记录领域 - API 路由
"""

from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.domains.auth.models import User
from app.domains.collections.schemas import (
    CollectionRecordCreate,
    CollectionRecordUpdate,
    CollectionRecordResponse,
)
from app.domains.collections.service import CollectionService

router = APIRouter()


def _to_str(value) -> str | None:
    """将各种类型转换为字符串"""
    if value is None:
        return None
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


@router.post("", response_model=CollectionRecordResponse, tags=["催收记录"])
async def create_collection_record(
    record_data: CollectionRecordCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建催收记录"""
    record = await CollectionService.create_record(db, current_user.id, record_data)
    return CollectionRecordResponse.model_validate(record)


@router.get("", response_model=list[CollectionRecordResponse], tags=["催收记录"])
async def get_collection_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取催收记录列表"""
    records = await CollectionService.get_records_by_user(db, current_user.id, skip, limit)
    result = []
    for r in records:
        record_dict = {
            k: _to_str(v) for k, v in r.__dict__.items()
            if not k.startswith('_')
        }
        result.append(CollectionRecordResponse(**record_dict))
    return result


@router.get("/{record_id}", response_model=CollectionRecordResponse, tags=["催收记录"])
async def get_collection_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取单个催收记录"""
    record = await CollectionService.get_record_by_id(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="催收记录不存在"
        )

    if record.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )

    record_dict = {
        k: _to_str(v) for k, v in record.__dict__.items()
        if not k.startswith('_')
    }
    return CollectionRecordResponse(**record_dict)


@router.put("/{record_id}", response_model=CollectionRecordResponse, tags=["催收记录"])
async def update_collection_record(
    record_id: str,
    update_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新催收记录"""
    update_dto = CollectionRecordUpdate(**update_data)
    is_admin = current_user.role == "ADMIN"

    record = await CollectionService.update_record(
        db, record_id, current_user.id, update_dto, is_admin
    )
    return CollectionRecordResponse.model_validate(record)


@router.delete("/{record_id}", tags=["催收记录"])
async def delete_collection_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除催收记录"""
    is_admin = current_user.role == "ADMIN"
    await CollectionService.delete_record(db, record_id, current_user.id, is_admin)
    return {"message": "催收记录删除成功"}