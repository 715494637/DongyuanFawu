"""
证据清单领域 - 业务逻辑服务

提供证据清单的查询、创建、更新和删除等业务逻辑
"""

import json
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.domains.evidence.models import EvidenceList
from app.domains.evidence.schemas import EvidenceListCreate
from app.utils import logger


class EvidenceService:
    """证据清单业务逻辑服务"""

    @staticmethod
    async def get_evidence(db: AsyncSession) -> List[dict]:
        """
        获取所有证据清单列表

        Args:
            db: 异步数据库会话

        Returns:
            List[dict]: 证据清单列表（字典格式）
        """
        result = await db.execute(select(EvidenceList))
        evidence = result.scalars().all()

        # 将 ORM 对象转换为字典，并解析 items 字段
        evidence_dicts = []
        for ev in evidence:
            ev_dict = {
                'id': ev.id,
                'title': ev.title,
                'items': json.loads(ev.items) if ev.items else []
            }
            evidence_dicts.append(ev_dict)

        logger.info(f"获取证据清单列表，共 {len(evidence)} 个")
        return evidence_dicts

    @staticmethod
    async def create_evidence(db: AsyncSession, evidence_data: EvidenceListCreate) -> EvidenceList:
        """
        创建新的证据清单

        Args:
            db: 异步数据库会话
            evidence_data: 证据清单创建数据

        Returns:
            EvidenceList: 创建的证据清单对象
        """
        new_evidence = EvidenceList(
            title=evidence_data.title,
            items=json.dumps(evidence_data.items or [])
        )

        db.add(new_evidence)
        await db.commit()
        await db.refresh(new_evidence)

        logger.info(f"新证据清单 {new_evidence.title} 创建成功")
        return new_evidence

    @staticmethod
    async def update_evidence(db: AsyncSession, evidence_id: str, evidence_data: EvidenceListCreate) -> EvidenceList:
        """
        更新证据清单

        Args:
            db: 异步数据库会话
            evidence_id: 证据清单ID
            evidence_data: 更新数据

        Returns:
            EvidenceList: 更新后的证据清单对象

        Raises:
            HTTPException: 证据清单不存在时抛出
        """
        result = await db.execute(select(EvidenceList).where(EvidenceList.id == evidence_id))
        evidence = result.scalar_one_or_none()

        if not evidence:
            logger.error(f"证据清单 {evidence_id} 不存在")
            raise HTTPException(status_code=404, detail="证据清单不存在")

        # 更新证据清单信息
        evidence.title = evidence_data.title
        evidence.items = json.dumps(evidence_data.items or [])

        await db.commit()
        await db.refresh(evidence)

        logger.info(f"证据清单 {evidence.title} 更新成功")
        return evidence

    @staticmethod
    async def delete_evidence(db: AsyncSession, evidence_id: str) -> None:
        """
        删除证据清单

        Args:
            db: 异步数据库会话
            evidence_id: 证据清单ID

        Raises:
            HTTPException: 证据清单不存在时抛出
        """
        result = await db.execute(select(EvidenceList).where(EvidenceList.id == evidence_id))
        evidence = result.scalar_one_or_none()

        if not evidence:
            logger.error(f"证据清单 {evidence_id} 不存在")
            raise HTTPException(status_code=404, detail="证据清单不存在")

        title = evidence.title
        await db.delete(evidence)
        await db.commit()

        logger.info(f"证据清单 {title} 删除成功")
