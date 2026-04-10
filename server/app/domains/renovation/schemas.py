"""
装修巡查领域 - Pydantic Schema

定义装修巡查相关的数据验证模型
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List


class RenovationRecordBase(BaseModel):
    """装修巡查基础模型"""
    property_unit: str = Field(..., min_length=1, max_length=200)
    check_date: Optional[str] = Field(None, max_length=20)
    check_result: Optional[str] = Field(None, max_length=20)
    violations: Optional[str] = None
    images: Optional[List[str]] = None
    inspector: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    status: str = Field(default="PENDING", max_length=20)


class RenovationRecordCreate(RenovationRecordBase):
    """装修巡查创建模型"""
    pass


class RenovationRecordUpdate(BaseModel):
    """装修巡查更新模型"""
    property_unit: Optional[str] = Field(None, min_length=1, max_length=200)
    check_date: Optional[str] = Field(None, max_length=20)
    check_result: Optional[str] = Field(None, max_length=20)
    violations: Optional[str] = None
    images: Optional[List[str]] = None
    inspector: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    status: Optional[str] = Field(None, max_length=20)


class RenovationRecordResponse(RenovationRecordBase):
    """装修巡查响应模型"""
    id: str
    user_id: str
    enterprise_name: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
