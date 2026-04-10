from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.domains.auth.models import User
from app.domains.config.schemas import (
    SystemConfigUpdate,
    SystemConfigResponse,
    SplashImageUpload,
    RenovationItemsUpdate,
)
from app.domains.config.service import ConfigService

router = APIRouter()


@router.get("", response_model=SystemConfigResponse)
async def get_config(db: AsyncSession = Depends(get_db)):
    """
    获取系统配置

    Args:
        db: 异步数据库会话

    Returns:
        SystemConfigResponse: 系统配置对象
    """
    return await ConfigService.get_config(db)


@router.put("")
async def update_config(
    config_data: SystemConfigUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新系统配置（仅管理员）

    Args:
        config_data: 更新数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 更新结果消息
    """
    await ConfigService.update_config(db, config_data)
    return {"message": "系统配置更新成功"}


@router.get("/splash-image")
async def get_splash_image(db: AsyncSession = Depends(get_db)):
    """
    获取开屏图

    Args:
        db: 异步数据库会话

    Returns:
        dict: 包含开屏图URL的字典
    """
    splash_image = await ConfigService.get_splash_image(db)
    return {"splash_image": splash_image}


@router.post("/splash-image")
async def upload_splash_image(
    splash_data: SplashImageUpload,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    上传开屏图（仅管理员）

    Args:
        splash_data: 开屏图数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 上传结果消息
    """
    await ConfigService.upload_splash_image(db, splash_data.model_dump())
    return {"message": "开屏图上传成功"}


@router.delete("/splash-image")
async def delete_splash_image(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除开屏图（仅管理员）

    Args:
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 删除结果消息
    """
    await ConfigService.delete_splash_image(db)
    return {"message": "开屏图删除成功"}


@router.get("/renovation-items")
async def get_renovation_items(db: AsyncSession = Depends(get_db)):
    """
    获取装修巡查项配置

    Args:
        db: 异步数据库会话

    Returns:
        dict: 包含装修巡查项列表的字典
    """
    items = await ConfigService.get_renovation_items(db)
    return {"items": items}


@router.put("/renovation-items")
async def update_renovation_items(
    data: RenovationItemsUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    保存装修巡查项配置（仅管理员）

    Args:
        data: 装修巡查项数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 保存结果消息
    """
    await ConfigService.update_renovation_items(db, data.items)
    return {"message": "装修巡查项配置保存成功"}
