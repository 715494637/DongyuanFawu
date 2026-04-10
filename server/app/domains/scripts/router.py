"""
话术库领域 - API 路由
"""

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.domains.scripts.service import ScriptService
from app.domains.auth.models import User
from app.core.dependencies import get_current_admin

router = APIRouter(prefix="/scripts")


@router.get("", tags=["话术库"])
async def get_scripts(db: AsyncSession = Depends(get_db)) -> List[Any]:
    """获取所有话术库（公开接口）"""
    return await ScriptService.get_all(db)


@router.get("/{script_id}", tags=["话术库"])
async def get_script(script_id: str, db: AsyncSession = Depends(get_db)) -> Any:
    """获取单个话术详情"""
    script = await ScriptService.get_by_id(db, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="话术不存在")
    return script


@router.post("", tags=["话术库"])
async def create_script(
    data: dict,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """创建话术（仅管理员）"""
    return await ScriptService.create(db, data)


@router.put("/{script_id}", tags=["话术库"])
async def update_script(
    script_id: str,
    data: dict,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """更新话术（仅管理员）"""
    script = await ScriptService.update(db, script_id, data)
    if not script:
        raise HTTPException(status_code=404, detail="话术不存在")
    return script


@router.delete("/{script_id}", tags=["话术库"])
async def delete_script(
    script_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """删除话术（仅管理员）"""
    if not await ScriptService.delete(db, script_id):
        raise HTTPException(status_code=404, detail="话术不存在")
    return {"message": "删除成功"}


# ============================================================================
# 用户端话术库路由（只读）
# ============================================================================
collection_router = APIRouter(prefix="/collection-scripts", tags=["催收话术库"])


@collection_router.get("", tags=["催收话术库"])
async def get_collection_scripts(db: AsyncSession = Depends(get_db)) -> List[Any]:
    """获取催收话术库（用户端只读接口）"""
    return await ScriptService.get_all(db)
