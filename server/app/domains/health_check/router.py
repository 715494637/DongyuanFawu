"""
法务体检领域 - API 路由
"""

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.domains.auth.models import User
from app.domains.health_check.service import HealthCheckService

router = APIRouter()


@router.get("", tags=["法务体检"])
async def get_health_check_sections(db: AsyncSession = Depends(get_db)) -> List[Any]:
    """获取法务体检题目（公开接口）"""
    return await HealthCheckService.get_all(db)


@router.get("/{section_id}", tags=["法务体检"])
async def get_health_check_section(
    section_id: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """获取单个法务体检板块详情"""
    section = await HealthCheckService.get_by_id(db, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="法务体检板块不存在")
    return section


@router.post("", tags=["法务体检"])
async def create_health_check_section(
    data: dict,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """创建法务体检题目（仅管理员）"""
    return await HealthCheckService.create(db, data)


@router.put("/{section_id}", tags=["法务体检"])
async def update_health_check_section(
    section_id: str,
    data: dict,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """更新法务体检题目（仅管理员）"""
    section = await HealthCheckService.update(db, section_id, data)
    if not section:
        raise HTTPException(status_code=404, detail="法务体检板块不存在")
    return section


@router.delete("/{section_id}", tags=["法务体检"])
async def delete_health_check_section(
    section_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """删除法务体检题目（仅管理员）"""
    if not await HealthCheckService.delete(db, section_id):
        raise HTTPException(status_code=404, detail="法务体检板块不存在")
    return {"message": "删除成功"}
