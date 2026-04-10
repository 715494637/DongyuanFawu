"""
服务请求领域 - API 路由
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.domains.auth.models import User
from app.domains.service_requests.schemas import (
    ServiceRequestCreate,
    ServiceRequestUpdate,
    ServiceRequestResponse,
    ServiceRequestListResponse,
    ServiceRequestAdminListResponse,
)
from app.domains.service_requests.service import ServiceRequestService

router = APIRouter()


@router.get("", response_model=List[ServiceRequestListResponse], tags=["服务请求"])
async def get_service_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[dict]:
    """获取当前用户的服务请求列表"""
    return await ServiceRequestService.get_by_user(db, current_user.id)


@router.get("/{request_id}", response_model=ServiceRequestResponse, tags=["服务请求"])
async def get_service_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取单个服务请求详情"""
    request = await ServiceRequestService.get_by_id(db, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="服务请求不存在")

    # 非管理员只能查看自己的请求
    if request.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="权限不足")

    return request


@router.post("", response_model=ServiceRequestListResponse, tags=["服务请求"])
async def create_service_request(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """提交服务请求"""
    request = await ServiceRequestService.create(db, current_user.id, data)
    return {
        "id": request.id,
        "userId": request.user_id,
        "requestType": request.request_type,
        "title": request.title,
        "content": request.description,
        "status": request.status,
        "timestamp": int(request.created_at.timestamp()) if hasattr(request.created_at, 'timestamp') else 0
    }


@router.put("/{request_id}", response_model=ServiceRequestResponse, tags=["服务请求"])
async def update_service_request(
    request_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新服务请求"""
    request = await ServiceRequestService.get_by_id(db, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="服务请求不存在")

    # 非管理员只能更新自己的请求
    if request.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="权限不足")

    updated = await ServiceRequestService.update(db, request_id, data)
    return updated


@router.delete("/{request_id}", tags=["服务请求"])
async def delete_service_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除服务请求"""
    request = await ServiceRequestService.get_by_id(db, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="服务请求不存在")

    # 非管理员只能删除自己的请求
    if request.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="权限不足")

    if not await ServiceRequestService.delete(db, request_id):
        raise HTTPException(status_code=404, detail="服务请求不存在")
    return {"message": "删除成功"}


# ============ 管理端接口 ============

@router.get("/admin/all", response_model=List[ServiceRequestAdminListResponse], tags=["服务请求-管理端"])
async def get_all_service_requests(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
) -> List[dict]:
    """获取所有服务请求（仅管理员）"""
    return await ServiceRequestService.get_all(db)


@router.put("/admin/{request_id}/status", tags=["服务请求-管理端"])
async def update_service_request_status(
    request_id: str,
    status: str = Query(...),
    admin_response: str = Query(None),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """更新服务请求状态（仅管理员）"""
    request = await ServiceRequestService.update_status(db, request_id, status, admin_response)
    if not request:
        raise HTTPException(status_code=404, detail="服务请求不存在")
    return {"message": "状态更新成功", "status": status}


@router.delete("/admin/rejected", tags=["服务请求-管理端"])
async def delete_rejected_requests(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """批量删除已驳回的服务请求（仅管理员）"""
    deleted_count = await ServiceRequestService.delete_by_status(db, "REJECTED")
    return {"message": f"已删除 {deleted_count} 条已驳回记录"}
