"""
民法典领域 - Pydantic Schema
"""

from pydantic import BaseModel, ConfigDict, Field


class CivilCodeArticleBase(BaseModel):
    """民法典基础模型"""
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)


class CivilCodeArticleCreate(CivilCodeArticleBase):
    """民法典创建模型"""
    pass


class CivilCodeArticleResponse(CivilCodeArticleBase):
    """民法典响应模型"""
    id: str

    model_config = ConfigDict(from_attributes=True)
