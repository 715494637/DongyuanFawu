"""
催收记录领域 - 业务逻辑服务
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from datetime import datetime
from app.domains.collections.models import CollectionRecord
from app.domains.collections.schemas import CollectionRecordCreate, CollectionRecordUpdate
from app.utils.logger import logger


def get_current_timestamp() -> str:
    """获取当前时间戳"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


class CollectionService:
    """催收记录业务逻辑服务"""

    @staticmethod
    async def create_record(
        db: AsyncSession,
        user_id: str,
        record_data: CollectionRecordCreate
    ) -> CollectionRecord:
        """创建催收记录"""
        record = CollectionRecord(
            user_id=user_id,
            **record_data.model_dump(),
            created_at=get_current_timestamp(),
            updated_at=get_current_timestamp()
        )

        db.add(record)
        await db.commit()
        await db.refresh(record)

        logger.info(f"创建催收记录: {record.id}")
        return record

    @staticmethod
    async def get_records_by_user(
        db: AsyncSession,
        user_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[CollectionRecord]:
        """获取用户的催收记录"""
        result = await db.execute(
            select(CollectionRecord)
            .where(CollectionRecord.user_id == user_id)
            .order_by(CollectionRecord.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_record_by_id(
        db: AsyncSession,
        record_id: str
    ) -> Optional[CollectionRecord]:
        """根据 ID 获取催收记录"""
        result = await db.execute(
            select(CollectionRecord).where(CollectionRecord.id == record_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_record(
        db: AsyncSession,
        record_id: str,
        user_id: str,
        update_data: CollectionRecordUpdate,
        is_admin: bool = False
    ) -> CollectionRecord:
        """更新催收记录"""
        record = await CollectionService.get_record_by_id(db, record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="催收记录不存在"
            )

        # 权限检查：非管理员只能更新自己的记录
        if not is_admin and record.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足"
            )

        # 更新字段
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(record, field, value)

        record.updated_at = get_current_timestamp()
        await db.commit()
        await db.refresh(record)

        logger.info(f"更新催收记录: {record.id}")
        return record

    @staticmethod
    async def delete_record(
        db: AsyncSession,
        record_id: str,
        user_id: str,
        is_admin: bool = False
    ) -> None:
        """删除催收记录"""
        record = await CollectionService.get_record_by_id(db, record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="催收记录不存在"
            )

        # 权限检查
        if not is_admin and record.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足"
            )

        await db.delete(record)
        await db.commit()

        logger.info(f"删除催收记录: {record.id}")