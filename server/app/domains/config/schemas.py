from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class SystemConfigBase(BaseModel):
    """系统配置基础模型"""
    enable_phone_login: bool = True
    welcome_message: Optional[str] = None
    ai_knowledge_base: Optional[str] = None
    enterprise_logo: Optional[str] = None
    splash_image: Optional[str] = None
    enable_splash_screen: bool = True


class SystemConfigUpdate(SystemConfigBase):
    """系统配置更新模型"""
    pass


class SystemConfigResponse(SystemConfigBase):
    """系统配置响应模型"""
    id: str
    renovation_items: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SplashImageUpload(BaseModel):
    """开屏图上传模型"""
    splash_image: str = Field(..., description="开屏图URL")


class RenovationItemsUpdate(BaseModel):
    """装修巡查项更新模型"""
    items: List[str] = Field(..., description="装修巡查项列表")
