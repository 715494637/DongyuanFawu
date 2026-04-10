"""
法务体检领域 - 业务逻辑服务
"""

import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.health_check.models import HealthCheckSection


class HealthCheckService:
    """法务体检业务逻辑服务"""

    @staticmethod
    async def get_all(db: AsyncSession) -> List[dict]:
        """获取所有法务体检板块"""
        result = await db.execute(
            select(HealthCheckSection)
            .where(HealthCheckSection.is_active == "1")
            .order_by(HealthCheckSection.sort_order)
        )
        sections = result.scalars().all()
        return [
            {
                "id": s.id,
                "title": s.section_title,
                "description": s.section_description,
                "category": s.category,
                "questions": json.loads(s.questions) if s.questions else [],
                "weight": int(s.weight) if s.weight else 1
            }
            for s in sections
        ]

    @staticmethod
    async def get_by_id(db: AsyncSession, section_id: str) -> Optional[dict]:
        """根据 ID 获取法务体检板块"""
        result = await db.execute(
            select(HealthCheckSection).where(HealthCheckSection.id == section_id)
        )
        section = result.scalar_one_or_none()
        if not section:
            return None
        return {
            "id": section.id,
            "title": section.section_title,
            "questions": json.loads(section.questions) if section.questions else []
        }

    @staticmethod
    async def create(db: AsyncSession, data: dict) -> dict:
        """创建法务体检板块"""
        section = HealthCheckSection(
            section_title=data.get("title", ""),
            section_description=data.get("description", ""),
            category=data.get("category", ""),
            questions=json.dumps(data.get("questions", [])),
            weight=str(data.get("weight", 1)),
            sort_order=str(data.get("sort_order", 0)),
            is_active="1"
        )
        db.add(section)
        await db.commit()
        await db.refresh(section)
        return {
            "id": section.id,
            "title": section.section_title,
            "questions": json.loads(section.questions) if section.questions else []
        }

    @staticmethod
    async def update(db: AsyncSession, section_id: str, data: dict) -> Optional[dict]:
        """更新法务体检板块"""
        result = await db.execute(
            select(HealthCheckSection).where(HealthCheckSection.id == section_id)
        )
        section = result.scalar_one_or_none()
        if not section:
            return None
        if "title" in data:
            section.section_title = data["title"]
        if "questions" in data:
            section.questions = json.dumps(data["questions"])
        await db.commit()
        return {
            "id": section.id,
            "title": section.section_title,
            "questions": json.loads(section.questions) if section.questions else []
        }

    @staticmethod
    async def delete(db: AsyncSession, section_id: str) -> bool:
        """删除法务体检板块"""
        result = await db.execute(
            select(HealthCheckSection).where(HealthCheckSection.id == section_id)
        )
        section = result.scalar_one_or_none()
        if not section:
            return False
        section.is_active = "0"
        await db.commit()
        return True
