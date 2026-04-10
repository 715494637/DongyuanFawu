"""
VIP权益领域 - Pydantic Schema
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Any


class VipLevelBase(BaseModel):
    """VIP等级基础模型"""
    level_name: str = Field(..., min_length=1, max_length=50)
    level_code: Optional[str] = Field(None, max_length=20)
    min_amount: float = Field(..., ge=0)
    max_amount: Optional[float] = Field(None, ge=0)
    benefits: Optional[List[str]] = Field(default_factory=list)
    selectable_projects_count: int = Field(default=0, ge=0)
    sort_order: int = Field(default=0, ge=0)


class VipLevelCreate(VipLevelBase):
    """创建VIP等级"""
    pass


class VipLevelUpdate(BaseModel):
    """更新VIP等级"""
    level_name: Optional[str] = Field(None, min_length=1, max_length=50)
    min_amount: Optional[float] = Field(None, ge=0)
    selectable_projects_count: Optional[int] = Field(None, ge=0)


class VipLevelResponse(BaseModel):
    """VIP等级响应"""
    id: str
    level_name: str
    level_code: Optional[str] = None
    min_amount: float
    max_amount: Optional[float] = None
    benefits: List[str]
    selectable_projects_count: int
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class EnterpriseStatsResponse(BaseModel):
    """企业统计数据响应"""
    enterprise_name: str
    total_recovered_amount: float = 0
    total_entrusted_amount: float = 0
    entrusted_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class EnterpriseStatsUpdate(BaseModel):
    """更新企业统计数据"""
    enterprise_name: str
    total_recovered_amount: Optional[float] = Field(None, ge=0)
    total_entrusted_amount: Optional[float] = Field(None, ge=0)
    entrusted_count: Optional[int] = Field(None, ge=0)


class SelectProjectsRequest(BaseModel):
    """选择专项服务请求"""
    project_ids: List[str]
