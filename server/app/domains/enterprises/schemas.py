"""
物业公司领域 - Pydantic Schema
"""

from pydantic import BaseModel, ConfigDict, Field


class EnterpriseBase(BaseModel):
    """企业基础模型"""
    name: str = Field(..., min_length=1, max_length=100)


class EnterpriseCreate(EnterpriseBase):
    """企业创建模型"""
    pass


class EnterpriseResponse(EnterpriseBase):
    """企业响应模型"""
    id: str

    model_config = ConfigDict(from_attributes=True)
