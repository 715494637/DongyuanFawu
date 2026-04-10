"""
装修巡查领域 - 业务逻辑服务

提供装修巡查记录的 CRUD 操作
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.domains.renovation.models import RenovationRecord as RenovationRecordModel
from app.domains.renovation.schemas import RenovationRecordCreate, RenovationRecordUpdate
from app.utils.logger import logger


def get_current_timestamp() -> str:
    """获取当前时间戳"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


class RenovationService:
    """装修巡查业务逻辑服务"""

    @staticmethod
    async def get_by_user(
        db: AsyncSession,
        user_id: str
    ) -> List[RenovationRecordModel]:
        """获取用户的装修巡查记录"""
        result = await db.execute(
            select(RenovationRecordModel)
            .where(RenovationRecordModel.user_id == user_id)
            .order_by(RenovationRecordModel.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        record_id: str
    ) -> Optional[RenovationRecordModel]:
        """根据 ID 获取装修巡查记录"""
        result = await db.execute(
            select(RenovationRecordModel).where(RenovationRecordModel.id == record_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: str,
        data: RenovationRecordCreate
    ) -> RenovationRecordModel:
        """创建装修巡查记录"""
        record = RenovationRecordModel(
            user_id=user_id,
            **data.model_dump(),
            created_at=get_current_timestamp(),
            updated_at=get_current_timestamp()
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)

        logger.info(f"创建装修巡查记录: {record.id}")
        return record

    @staticmethod
    async def update(
        db: AsyncSession,
        record_id: str,
        data: RenovationRecordUpdate
    ) -> Optional[RenovationRecordModel]:
        """更新装修巡查记录"""
        record = await RenovationService.get_by_id(db, record_id)
        if not record:
            return None

        # 更新字段
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(record, field, value)

        record.updated_at = get_current_timestamp()
        await db.commit()
        await db.refresh(record)

        logger.info(f"更新装修巡查记录: {record.id}")
        return record

    @staticmethod
    async def delete(db: AsyncSession, record_id: str) -> bool:
        """删除装修巡查记录"""
        record = await RenovationService.get_by_id(db, record_id)
        if not record:
            return False

        await db.delete(record)
        await db.commit()

        logger.info(f"删除装修巡查记录: {record.id}")
        return True
