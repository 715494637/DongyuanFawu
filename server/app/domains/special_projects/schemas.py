"""
专项服务领域 - Pydantic Schema
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class SpecialProjectBase(BaseModel):
    """专项服务基础模型"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class SpecialProjectCreate(SpecialProjectBase):
    """创建专项服务"""
    pass


class SpecialProjectUpdate(BaseModel):
    """更新专项服务"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None


class SpecialProjectResponse(SpecialProjectBase):
    """专项服务响应"""
    id: str

    model_config = ConfigDict(from_attributes=True)
