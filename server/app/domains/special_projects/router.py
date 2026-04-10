"""
专项服务领域 - API 路由
"""

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.domains.special_projects.service import SpecialProjectService
from app.domains.special_projects.schemas import (
    SpecialProjectCreate,
    SpecialProjectUpdate,
    SpecialProjectResponse,
)
from app.core.dependencies import get_current_admin
from app.domains.auth.models import User

router = APIRouter()


@router.get("", response_model=List[SpecialProjectResponse], tags=["专项服务"])
async def get_special_projects(db: AsyncSession = Depends(get_db)) -> List[SpecialProjectResponse]:
    """获取所有专项服务（公开接口）"""
    projects = await SpecialProjectService.get_all(db)
    return [SpecialProjectResponse.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=SpecialProjectResponse, tags=["专项服务"])
async def get_special_project(project_id: str, db: AsyncSession = Depends(get_db)) -> SpecialProjectResponse:
    """获取单个专项服务详情"""
    project = await SpecialProjectService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="专项服务不存在")
    return SpecialProjectResponse.model_validate(project)


@router.post("", response_model=SpecialProjectResponse, tags=["专项服务"])
async def create_special_project(
    data: SpecialProjectCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
) -> SpecialProjectResponse:
    """创建专项服务（仅管理员）"""
    project = await SpecialProjectService.create(db, data)
    return SpecialProjectResponse.model_validate(project)


@router.put("/{project_id}", response_model=SpecialProjectResponse, tags=["专项服务"])
async def update_special_project(
    project_id: str,
    data: SpecialProjectUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
) -> SpecialProjectResponse:
    """更新专项服务（仅管理员）"""
    project = await SpecialProjectService.update(db, project_id, data)
    if not project:
        raise HTTPException(status_code=404, detail="专项服务不存在")
    return SpecialProjectResponse.model_validate(project)


@router.delete("/{project_id}", tags=["专项服务"])
async def delete_special_project(
    project_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """删除专项服务（仅管理员）"""
    if not await SpecialProjectService.delete(db, project_id):
        raise HTTPException(status_code=404, detail="专项服务不存在")
    return {"message": "删除成功"}
