"""
风险场景领域 - 业务逻辑服务

提供风险场景的查询、创建、更新和删除等业务逻辑
"""

import json
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.domains.risks.models import RiskScenario
from app.domains.risks.schemas import RiskScenarioCreate
from app.utils.logger import logger


class RiskService:
    """风险场景业务逻辑服务"""

    @staticmethod
    async def get_risks(db: AsyncSession) -> List[dict]:
        """
        获取所有风险场景列表

        Args:
            db: 异步数据库会话

        Returns:
            List[dict]: 风险场景列表（字典格式）
        """
        result = await db.execute(select(RiskScenario))
        risks = result.scalars().all()

        # 将 ORM 对象转换为字典，并解析 questions 字段
        risk_dicts = []
        for risk in risks:
            risk_dict = {
                'id': risk.id,
                'title': risk.title,
                'risk_level': risk.risk_level,
                'content': risk.content,
                'questions': json.loads(risk.questions) if risk.questions else []
            }
            risk_dicts.append(risk_dict)

        logger.info(f"获取风险场景列表，共 {len(risks)} 个")
        return risk_dicts

    @staticmethod
    async def create_risk(db: AsyncSession, risk_data: RiskScenarioCreate) -> RiskScenario:
        """
        创建新的风险场景

        Args:
            db: 异步数据库会话
            risk_data: 风险场景创建数据

        Returns:
            RiskScenario: 创建的风险场景对象

        Raises:
            HTTPException: 创建失败时抛出
        """
        try:
            new_risk = RiskScenario(
                title=risk_data.title,
                risk_level=risk_data.risk_level,
                content=risk_data.content,
                questions=json.dumps(risk_data.questions or [])
            )

            db.add(new_risk)
            await db.commit()
            await db.refresh(new_risk)

            logger.info(f"新风险场景 {new_risk.title} 创建成功")
            return new_risk
        except Exception as e:
            logger.error(f"创建风险场景失败: {e}")
            await db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="创建风险场景失败")

    @staticmethod
    async def update_risk(db: AsyncSession, risk_id: str, risk_data: RiskScenarioCreate) -> RiskScenario:
        """
        更新风险场景

        Args:
            db: 异步数据库会话
            risk_id: 风险场景ID
            risk_data: 更新数据

        Returns:
            RiskScenario: 更新后的风险场景对象

        Raises:
            HTTPException: 风险场景不存在时抛出
        """
        result = await db.execute(select(RiskScenario).where(RiskScenario.id == risk_id))
        risk = result.scalar_one_or_none()

        if not risk:
            logger.error(f"风险场景 {risk_id} 不存在")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="风险场景不存在")

        # 更新风险场景信息
        risk.title = risk_data.title
        risk.risk_level = risk_data.risk_level
        risk.content = risk_data.content
        risk.questions = json.dumps(risk_data.questions or [])

        await db.commit()
        await db.refresh(risk)

        logger.info(f"风险场景 {risk.title} 更新成功")
        return risk

    @staticmethod
    async def delete_risk(db: AsyncSession, risk_id: str) -> None:
        """
        删除风险场景

        Args:
            db: 异步数据库会话
            risk_id: 风险场景ID

        Raises:
            HTTPException: 风险场景不存在时抛出
        """
        result = await db.execute(select(RiskScenario).where(RiskScenario.id == risk_id))
        risk = result.scalar_one_or_none()

        if not risk:
            logger.error(f"风险场景 {risk_id} 不存在")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="风险场景不存在")

        title = risk.title
        await db.delete(risk)
        await db.commit()

        logger.info(f"风险场景 {title} 删除成功")
