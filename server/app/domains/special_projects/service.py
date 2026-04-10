"""
专项服务领域 - 业务逻辑服务
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.special_projects.models import SpecialProject
from app.domains.special_projects.schemas import SpecialProjectCreate, SpecialProjectUpdate
from app.utils.logger import logger


class SpecialProjectService:
    """专项服务业务逻辑服务"""

    @staticmethod
    async def get_all(db: AsyncSession) -> List[SpecialProject]:
        """获取所有专项服务"""
        result = await db.execute(select(SpecialProject))
        projects = result.scalars().all()
        return list(projects)

    @staticmethod
    async def get_by_id(db: AsyncSession, project_id: str) -> Optional[SpecialProject]:
        """获取单个专项服务"""
        result = await db.execute(
            select(SpecialProject).where(SpecialProject.id == project_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, data: SpecialProjectCreate) -> SpecialProject:
        """创建专项服务"""
        project = SpecialProject(
            title=data.title,
            description=data.description
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)
        logger.info(f"创建专项服务: {project.id}")
        return project

    @staticmethod
    async def update(db: AsyncSession, project_id: str, data: SpecialProjectUpdate) -> Optional[SpecialProject]:
        """更新专项服务"""
        project = await SpecialProjectService.get_by_id(db, project_id)
        if not project:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        await db.commit()
        await db.refresh(project)
        logger.info(f"更新专项服务: {project.id}")
        return project

    @staticmethod
    async def delete(db: AsyncSession, project_id: str) -> bool:
        """删除专项服务"""
        project = await SpecialProjectService.get_by_id(db, project_id)
        if not project:
            return False

        await db.delete(project)
        await db.commit()
        logger.info(f"删除专项服务: {project_id}")
        return True
