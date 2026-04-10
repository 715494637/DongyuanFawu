"""
应急预案领域 - 业务逻辑服务

提供应急预案的 CRUD 业务逻辑
"""

import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.sops.models import SOP
from app.utils.logger import logger


class SOPService:
    """应急预案业务逻辑服务"""

    @staticmethod
    async def get_all(db: AsyncSession) -> List[dict]:
        """获取所有应急预案"""
        result = await db.execute(
            select(SOP).where(SOP.is_active == "1")
        )
        sops = result.scalars().all()
        return [
            {
                "id": s.id,
                "title": s.title,
                "category": s.category,
                "content": s.content,
                "steps": json.loads(s.steps) if s.steps else [],
                "is_active": s.is_active == "1"
            }
            for s in sops
        ]

    @staticmethod
    async def get_by_id(db: AsyncSession, sop_id: str) -> Optional[dict]:
        """获取单个应急预案"""
        result = await db.execute(select(SOP).where(SOP.id == sop_id))
        sop = result.scalar_one_or_none()
        if not sop:
            return None
        return {
            "id": sop.id,
            "title": sop.title,
            "category": sop.category,
            "content": sop.content,
            "steps": json.loads(sop.steps) if sop.steps else [],
            "is_active": sop.is_active == "1"
        }

    @staticmethod
    async def create(db: AsyncSession, data: dict) -> dict:
        """创建应急预案"""
        # 将 steps 数组转换为 JSON 字符串存储
        steps_json = json.dumps(data.get("steps", []), ensure_ascii=False)
        sop = SOP(
            title=data.get("title", ""),
            category=data.get("category", ""),
            content=data.get("content", ""),
            steps=steps_json,
            is_active="1"
        )
        db.add(sop)
        await db.commit()
        await db.refresh(sop)
        logger.info(f"创建应急预案: {sop.id}")
        return {
            "id": sop.id,
            "title": sop.title,
            "category": sop.category,
            "content": sop.content,
            "steps": json.loads(sop.steps) if sop.steps else [],
            "is_active": sop.is_active == "1"
        }

    @staticmethod
    async def update(db: AsyncSession, sop_id: str, data: dict) -> Optional[dict]:
        """更新应急预案"""
        result = await db.execute(select(SOP).where(SOP.id == sop_id))
        sop = result.scalar_one_or_none()
        if not sop:
            return None
        if "title" in data:
            sop.title = data["title"]
        if "category" in data:
            sop.category = data["category"]
        if "content" in data:
            sop.content = data["content"]
        if "steps" in data:
            # 将 steps 数组转换为 JSON 字符串存储
            sop.steps = json.dumps(data["steps"], ensure_ascii=False)
        await db.commit()
        logger.info(f"更新应急预案: {sop.id}")
        return {
            "id": sop.id,
            "title": sop.title,
            "category": sop.category,
            "content": sop.content,
            "steps": json.loads(sop.steps) if sop.steps else [],
            "is_active": sop.is_active == "1"
        }

    @staticmethod
    async def delete(db: AsyncSession, sop_id: str) -> bool:
        """删除应急预案（软删除）"""
        result = await db.execute(select(SOP).where(SOP.id == sop_id))
        sop = result.scalar_one_or_none()
        if not sop:
            return False
        sop.is_active = "0"
        await db.commit()
        logger.info(f"删除应急预案: {sop.id}")
        return True
