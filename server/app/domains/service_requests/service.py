"""
服务请求领域 - 业务逻辑服务
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import datetime as dt
from app.domains.service_requests.models import ServiceRequest
from app.domains.users.models import User
from app.domains.service_requests.schemas import (
    ServiceRequestCreate,
    ServiceRequestUpdate,
)
from app.utils.logger import logger


def _parse_timestamp(value) -> int:
    """将 MySQL DATETIME 字符串或 datetime 对象转换为 Unix 时间戳（秒）"""
    if not value:
        return 0
    try:
        # 如果已经是 datetime 对象（数据库返回）
        if isinstance(value, dt.datetime):
            return int(value.timestamp())
        # 如果是纯数字字符串（时间戳）
        if isinstance(value, str) and value.isdigit():
            ts = int(value)
            # 如果时间戳小于 10 亿（2001年之前），说明是秒，否则是毫秒
            if ts < 1_000_000_000:
                return ts
            else:
                return ts // 1000
        # 解析 MySQL DATETIME 格式字符串
        if isinstance(value, str):
            return int(dt.datetime.strptime(value, '%Y-%m-%d %H:%M:%S').timestamp())
        return 0
    except Exception as e:
        print(f"[WARN] Failed to parse timestamp: {value}, error: {e}")
        return 0


class ServiceRequestService:
    """服务请求业务逻辑服务"""

    @staticmethod
    async def get_by_user(db: AsyncSession, user_id: str) -> List[dict]:
        """获取用户的服务请求列表"""
        result = await db.execute(
            select(ServiceRequest).where(ServiceRequest.user_id == user_id)
        )
        requests = result.scalars().all()
        return [
            {
                "id": r.id,
                "userId": r.user_id,
                "requestType": r.request_type,
                "title": r.title,
                "content": r.description,
                "status": r.status,
                "timestamp": _parse_timestamp(r.created_at)
            }
            for r in requests
        ]

    @staticmethod
    async def get_all(db: AsyncSession) -> List[dict]:
        """获取所有服务请求（管理员）"""
        result = await db.execute(select(ServiceRequest))
        requests = result.scalars().all()

        # 获取所有用户ID
        user_ids = list(set(r.user_id for r in requests))
        if user_ids:
            user_result = await db.execute(select(User).where(User.id.in_(user_ids)))
            users = {u.id: u.username for u in user_result.scalars().all()}
        else:
            users = {}

        return [
            {
                "id": r.id,
                "userId": r.user_id,
                "username": users.get(r.user_id, "未知用户"),
                "enterpriseName": r.enterprise_name or "",
                "requestType": r.request_type,
                "title": r.title,
                "content": r.description,
                "status": r.status,
                "priority": r.priority,
                "timestamp": _parse_timestamp(r.created_at)
            }
            for r in requests
        ]

    @staticmethod
    async def get_by_id(db: AsyncSession, request_id: str) -> Optional[ServiceRequest]:
        """根据 ID 获取服务请求"""
        result = await db.execute(
            select(ServiceRequest).where(ServiceRequest.id == request_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: str,
        data: dict
    ) -> ServiceRequest:
        """创建服务请求"""
        timestamp = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        request = ServiceRequest(
            user_id=user_id,
            request_type=data.get("request_type", ""),
            title=data.get("title", ""),
            description=data.get("description", ""),
            enterprise_name=data.get("enterprise_name"),
            status="PENDING",
            created_at=timestamp
        )
        db.add(request)
        await db.commit()
        await db.refresh(request)

        logger.info(f"创建服务请求: {request.id}")
        return request

    @staticmethod
    async def update(
        db: AsyncSession,
        request_id: str,
        data: dict
    ) -> Optional[ServiceRequest]:
        """更新服务请求"""
        request = await ServiceRequestService.get_by_id(db, request_id)
        if not request:
            return None

        if "description" in data:
            request.description = data["description"]
        if "status" in data:
            request.status = data["status"]
        if "request_type" in data:
            request.request_type = data["request_type"]
        if "title" in data:
            request.title = data["title"]
        if "enterprise_name" in data:
            request.enterprise_name = data["enterprise_name"]

        await db.commit()
        await db.refresh(request)

        logger.info(f"更新服务请求: {request.id}")
        return request

    @staticmethod
    async def delete(db: AsyncSession, request_id: str) -> bool:
        """删除服务请求"""
        request = await ServiceRequestService.get_by_id(db, request_id)
        if not request:
            return False

        await db.delete(request)
        await db.commit()

        logger.info(f"删除服务请求: {request_id}")
        return True

    @staticmethod
    async def update_status(
        db: AsyncSession,
        request_id: str,
        status: str,
        admin_response: Optional[str] = None
    ) -> Optional[ServiceRequest]:
        """更新服务请求状态（管理员）"""
        request = await ServiceRequestService.get_by_id(db, request_id)
        if not request:
            return None

        request.status = status
        if admin_response:
            request.admin_response = admin_response

        await db.commit()
        await db.refresh(request)

        logger.info(f"更新服务请求状态: {request_id} -> {status}")
        return request

    @staticmethod
    async def delete_by_status(db: AsyncSession, status: str) -> int:
        """批量删除指定状态的请求，返回删除数量"""
        result = await db.execute(
            select(ServiceRequest).where(ServiceRequest.status == status)
        )
        requests = result.scalars().all()
        count = len(requests)
        for request in requests:
            await db.delete(request)
        await db.commit()
        return count
