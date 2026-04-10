"""
催收记录领域 - Pydantic Schema
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class CollectionRecordBase(BaseModel):
    """催收记录基础模型"""
    debtor_name: str = Field(..., min_length=1, max_length=100)
    debtor_phone: Optional[str] = Field(None, max_length=20)
    property_unit: str = Field(..., min_length=1, max_length=200)
    property_area: Optional[str] = Field(None, max_length=50)
    arrears_amount: str = Field(..., pattern=r'^\d+(\.\d{1,2})?$')
    arrears_months: Optional[str] = Field(None, max_length=10)
    fee_type: Optional[str] = Field(None, max_length=50)
    collection_status: str = Field(default="PENDING", max_length=20)
    last_collection_date: Optional[str] = None
    notes: Optional[str] = None


class CollectionRecordCreate(CollectionRecordBase):
    """创建催收记录"""
    pass


class CollectionRecordUpdate(BaseModel):
    """更新催收记录"""
    debtor_name: Optional[str] = Field(None, min_length=1, max_length=100)
    debtor_phone: Optional[str] = Field(None, max_length=20)
    property_unit: Optional[str] = Field(None, min_length=1, max_length=200)
    property_area: Optional[str] = Field(None, max_length=50)
    arrears_amount: Optional[str] = Field(None, pattern=r'^\d+(\.\d{1,2})?$')
    arrears_months: Optional[str] = Field(None, max_length=10)
    fee_type: Optional[str] = Field(None, max_length=50)
    collection_status: Optional[str] = Field(None, max_length=20)
    last_collection_date: Optional[str] = None
    notes: Optional[str] = None


class CollectionRecordResponse(CollectionRecordBase):
    """催收记录响应"""
    id: str
    user_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)