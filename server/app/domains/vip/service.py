"""
VIP权益领域 - 业务逻辑服务
"""

import json
import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.vip.models import VipLevel
from app.domains.enterprises.models import EnterpriseStats
from app.domains.users.models import User
from app.domains.special_projects.models import SpecialProject
from app.domains.service_requests.models import ServiceRequest


class VipService:
    """VIP权益业务逻辑服务"""

    @staticmethod
    async def get_levels(db: AsyncSession) -> List[dict]:
        """获取所有VIP等级配置"""
        result = await db.execute(
            select(VipLevel)
            .where(VipLevel.is_active == "1")
            .order_by(VipLevel.sort_order)
        )
        levels = result.scalars().all()
        return [
            {
                "id": l.id,
                "level_name": l.level_name,
                "level_code": l.level_code,
                "min_amount": float(l.min_amount) if l.min_amount else 0,
                "max_amount": float(l.max_amount) if l.max_amount else None,
                "benefits": json.loads(l.benefits) if l.benefits else [],
                "selectable_projects_count": int(l.selectable_projects_count) if l.selectable_projects_count else 0,
                "sort_order": int(l.sort_order) if l.sort_order else 0
            }
            for l in levels
        ]

    @staticmethod
    async def get_level_by_id(db: AsyncSession, level_id: str) -> Optional[dict]:
        """根据ID获取VIP等级"""
        result = await db.execute(select(VipLevel).where(VipLevel.id == level_id))
        level = result.scalar_one_or_none()
        if not level:
            return None
        return {
            "id": level.id,
            "level_name": level.level_name,
            "level_code": level.level_code,
            "min_amount": float(level.min_amount) if level.min_amount else 0,
            "max_amount": float(level.max_amount) if level.max_amount else None,
            "benefits": json.loads(level.benefits) if level.benefits else [],
            "selectable_projects_count": int(level.selectable_projects_count) if level.selectable_projects_count else 0,
            "sort_order": int(level.sort_order) if level.sort_order else 0
        }

    @staticmethod
    async def create_level(db: AsyncSession, data: dict) -> dict:
        """创建VIP等级"""
        level = VipLevel(
            level_name=data.get("level_name", ""),
            level_code=data.get("level_code", ""),
            min_amount=str(data.get("min_amount", 0)),
            max_amount=str(data.get("max_amount", "")) if data.get("max_amount") else None,
            benefits=json.dumps(data.get("benefits", [])),
            selectable_projects_count=str(data.get("selectable_projects_count", 0)),
            sort_order=str(data.get("sort_order", 0)),
            is_active="1"
        )
        db.add(level)
        await db.commit()
        await db.refresh(level)
        return {
            "id": level.id,
            "level_name": level.level_name,
            "min_amount": float(level.min_amount) if level.min_amount else 0
        }

    @staticmethod
    async def update_level(db: AsyncSession, level_id: str, data: dict) -> Optional[dict]:
        """更新VIP等级"""
        result = await db.execute(select(VipLevel).where(VipLevel.id == level_id))
        level = result.scalar_one_or_none()
        if not level:
            return None
        if "level_name" in data:
            level.level_name = data["level_name"]
        if "min_amount" in data:
            level.min_amount = str(data["min_amount"])
        if "selectable_projects_count" in data:
            level.selectable_projects_count = str(data["selectable_projects_count"])
        if "benefits" in data:
            level.benefits = json.dumps(data["benefits"])
        await db.commit()
        await db.refresh(level)
        return {
            "id": level.id,
            "level_name": level.level_name,
            "min_amount": float(level.min_amount) if level.min_amount else 0
        }

    @staticmethod
    async def delete_level(db: AsyncSession, level_id: str) -> bool:
        """删除VIP等级（软删除）"""
        result = await db.execute(select(VipLevel).where(VipLevel.id == level_id))
        level = result.scalar_one_or_none()
        if not level:
            return False
        level.is_active = "0"
        await db.commit()
        return True

    @staticmethod
    async def get_stats(db: AsyncSession, enterprise_name: str) -> dict:
        """获取企业统计数据"""
        result = await db.execute(
            select(EnterpriseStats).where(EnterpriseStats.enterprise_name == enterprise_name)
        )
        stats = result.scalar_one_or_none()
        if not stats:
            return {
                "enterprise_name": enterprise_name,
                "total_recovered_amount": 0,
                "total_entrusted_amount": 0,
                "entrusted_count": 0
            }
        return {
            "enterprise_name": stats.enterprise_name,
            "total_recovered_amount": float(stats.collected_amount) if stats.collected_amount else 0,
            "total_entrusted_amount": float(stats.total_arrears) if stats.total_arrears else 0,
            "entrusted_count": int(stats.total_cases) if stats.total_cases else 0
        }

    @staticmethod
    async def update_stats(db: AsyncSession, enterprise_name: str, data: dict) -> dict:
        """更新或创建企业统计数据"""
        result = await db.execute(
            select(EnterpriseStats).where(EnterpriseStats.enterprise_name == enterprise_name)
        )
        stats = result.scalar_one_or_none()

        if not stats:
            stats = EnterpriseStats(enterprise_name=enterprise_name)
            db.add(stats)

        if "total_recovered_amount" in data:
            stats.collected_amount = str(data["total_recovered_amount"])
        if "total_entrusted_amount" in data:
            stats.total_arrears = str(data["total_entrusted_amount"])
        if "entrusted_count" in data:
            stats.total_cases = str(data["entrusted_count"])

        await db.commit()
        return {"enterprise_name": enterprise_name, "success": True}

    @staticmethod
    async def select_projects(db: AsyncSession, user_id: str, project_ids: List[str]) -> bool:
        """选择专项服务时创建服务请求（需要管理员审批）"""
        # 获取用户信息
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return False

        enterprise_name = user.enterprise_name or ""

        # 获取项目信息
        project_titles = {}
        if project_ids:
            proj_result = await db.execute(
                select(SpecialProject).where(SpecialProject.id.in_(project_ids))
            )
            projects = proj_result.scalars().all()
            for proj in projects:
                project_titles[proj.id] = proj.title

        # 为每个选中的项目创建服务请求
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        for project_id in project_ids:
            title = project_titles.get(project_id, "未知服务")
            request = ServiceRequest(
                user_id=user_id,
                enterprise_name=enterprise_name,
                request_type="SELECT_PROJECT",
                title=f"申请开通专项服务：{title}",
                description=f"申请开通专项服务：{title}（ID: {project_id}）",
                status="PENDING",
                priority="NORMAL",
                created_at=timestamp
            )
            db.add(request)

        await db.commit()
        return True
