"""
物业公司领域 - 业务逻辑服务
"""

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.domains.enterprises.models import Enterprise
from app.domains.enterprises.schemas import EnterpriseCreate
from app.utils.logger import logger


class EnterpriseService:
    """物业公司业务逻辑服务"""

    @staticmethod
    async def get_enterprises(db: AsyncSession) -> List[str]:
        """
        获取所有物业公司名称列表

        Args:
            db: 异步数据库会话

        Returns:
            List[str]: 物业公司名称列表
        """
        result = await db.execute(select(Enterprise))
        enterprises = result.scalars().all()
        names = [e.name for e in enterprises]
        logger.info(f"获取物业公司列表，共 {len(names)} 个")
        return names

    @staticmethod
    async def create_enterprise(db: AsyncSession, enterprise: EnterpriseCreate) -> None:
        """
        添加新的物业公司

        Args:
            db: 异步数据库会话
            enterprise: 物业公司创建数据

        Raises:
            HTTPException: 物业公司已存在时抛出
        """
        # 检查物业公司是否已存在
        result = await db.execute(select(Enterprise).where(Enterprise.name == enterprise.name))
        if result.scalar_one_or_none():
            logger.warning(f"物业公司 {enterprise.name} 已存在")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="物业公司已存在")

        new_enterprise = Enterprise(name=enterprise.name)
        db.add(new_enterprise)
        await db.commit()

        logger.info(f"新物业公司 {enterprise.name} 添加成功")

    @staticmethod
    async def delete_enterprise(db: AsyncSession, name: str) -> None:
        """
        删除物业公司

        Args:
            db: 异步数据库会话
            name: 物业公司名称

        Raises:
            HTTPException: 物业公司不存在时抛出
        """
        result = await db.execute(select(Enterprise).where(Enterprise.name == name))
        enterprise = result.scalar_one_or_none()

        if not enterprise:
            logger.error(f"物业公司 {name} 不存在")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="物业公司不存在")

        await db.delete(enterprise)
        await db.commit()

        logger.info(f"物业公司 {name} 删除成功")
