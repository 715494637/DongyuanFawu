"""
法务体检领域 - Pydantic Schema
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List


class HealthCheckSectionBase(BaseModel):
    """法务体检板块基础模型"""
    section_title: str
    section_description: Optional[str] = None
    category: str
    questions: List[dict]
    weight: int = 1
    sort_order: int = 0


class HealthCheckSectionCreate(HealthCheckSectionBase):
    """法务体检板块创建模型"""
    pass


class HealthCheckSectionUpdate(BaseModel):
    """法务体检板块更新模型"""
    section_title: Optional[str] = None
    section_description: Optional[str] = None
    category: Optional[str] = None
    questions: Optional[List[dict]] = None
    weight: Optional[int] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class HealthCheckSectionResponse(BaseModel):
    """法务体检板块响应模型"""
    id: str
    section_title: str
    section_description: Optional[str] = None
    category: str
    questions: List[dict]
    weight: int = 1
    sort_order: int = 0
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)
