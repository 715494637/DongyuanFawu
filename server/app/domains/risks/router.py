"""
风险场景领域 - API 路由

提供风险场景的查询、创建、更新和删除功能
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.domains.risks.schemas import RiskScenarioCreate
from app.domains.risks.service import RiskService
from app.core.dependencies import get_current_admin
from app.domains.auth.models import User

router = APIRouter()


@router.get("", response_class=JSONResponse, response_model=None)
async def get_risks(db: AsyncSession = Depends(get_db)):
    """
    获取所有风险场景列表

    Args:
        db: 异步数据库会话

    Returns:
        JSONResponse: 风险场景列表
    """
    return JSONResponse(content=await RiskService.get_risks(db))


@router.post("")
async def create_risk(
    risk_data: RiskScenarioCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    创建新的风险场景（仅管理员）

    Args:
        risk_data: 风险场景创建数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        RiskScenario: 创建的风险场景对象

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
    """
    return await RiskService.create_risk(db, risk_data)


@router.put("/{risk_id}")
async def update_risk(
    risk_id: str,
    risk_data: RiskScenarioCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新风险场景（仅管理员）

    Args:
        risk_id: 风险场景ID
        risk_data: 更新数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        RiskScenario: 更新后的风险场景对象

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 风险场景不存在时抛出 404 错误
    """
    return await RiskService.update_risk(db, risk_id, risk_data)


@router.delete("/{risk_id}")
async def delete_risk(
    risk_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除风险场景（仅管理员）

    Args:
        risk_id: 风险场景ID
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 删除结果消息

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 风险场景不存在时抛出 404 错误
    """
    await RiskService.delete_risk(db, risk_id)
    return {"message": "风险场景删除成功"}
