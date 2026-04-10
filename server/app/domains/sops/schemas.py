"""
应急预案领域 - Pydantic Schema

定义应急预案相关的数据验证模型
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List


class SOPBase(BaseModel):
    """SOP 基础模型"""
    title: str
    category: Optional[str] = None
    content: Optional[str] = None
    steps: Optional[List[dict]] = None


class SOPCreate(SOPBase):
    """SOP 创建模型"""
    pass


class SOPUpdate(BaseModel):
    """SOP 更新模型"""
    title: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    steps: Optional[List[dict]] = None
    is_active: Optional[bool] = None


class SOPResponse(SOPBase):
    """SOP 响应模型"""
    id: str
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)
