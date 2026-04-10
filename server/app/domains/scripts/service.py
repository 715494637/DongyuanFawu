"""
话术库领域 - 业务逻辑服务
"""

from typing import List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.domains.scripts.models import Script
from app.domains.scripts.schemas import ScriptCreate, ScriptUpdate
from app.utils.logger import logger


def script_to_dict(s: Script) -> dict:
    """将 Script 模型转换为字典"""
    return {
        "id": s.id,
        "title": s.title,
        "category": s.category,
        "steps": s.steps if s.steps else [],
        "is_active": s.is_active == "1",
        "created_at": s.created_at,
        "updated_at": s.updated_at
    }


class ScriptService:
    """话术库业务逻辑服务"""

    @staticmethod
    async def get_all(db: AsyncSession) -> List[dict]:
        """获取所有话术"""
        result = await db.execute(
            select(Script).where(Script.is_active == "1")
        )
        scripts = result.scalars().all()
        return [script_to_dict(s) for s in scripts]

    @staticmethod
    async def get_by_id(db: AsyncSession, script_id: str) -> Optional[dict]:
        """获取单个话术"""
        result = await db.execute(select(Script).where(Script.id == script_id))
        script = result.scalar_one_or_none()
        if not script:
            return None
        return script_to_dict(script)

    @staticmethod
    async def create(db: AsyncSession, data: dict) -> dict:
        """创建话术"""
        script = Script(
            title=data.get("title", ""),
            category=data.get("category", ""),
            steps=data.get("steps", []),
            is_active="1"
        )
        db.add(script)
        await db.commit()
        await db.refresh(script)
        logger.info(f"创建话术: {script.id}")
        return script_to_dict(script)

    @staticmethod
    async def update(db: AsyncSession, script_id: str, data: dict) -> Optional[dict]:
        """更新话术"""
        result = await db.execute(select(Script).where(Script.id == script_id))
        script = result.scalar_one_or_none()
        if not script:
            return None

        if "title" in data:
            script.title = data["title"]
        if "category" in data:
            script.category = data["category"]
        if "steps" in data:
            script.steps = data["steps"]

        await db.commit()
        await db.refresh(script)
        logger.info(f"更新话术: {script.id}")
        return script_to_dict(script)

    @staticmethod
    async def delete(db: AsyncSession, script_id: str) -> bool:
        """删除话术（软删除）"""
        result = await db.execute(select(Script).where(Script.id == script_id))
        script = result.scalar_one_or_none()
        if not script:
            return False
        script.is_active = "0"
        await db.commit()
        logger.info(f"删除话术: {script_id}")
        return True
