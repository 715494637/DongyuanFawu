"""
海报领域 - Pydantic Schema
"""

from pydantic import BaseModel, ConfigDict, Field


class CustomPosterBase(BaseModel):
    """自定义海报基础模型"""
    name: str = Field(..., min_length=1, max_length=100)
    image_url: str = Field(..., description="海报图片 URL 或 base64 数据")


class CustomPosterCreate(CustomPosterBase):
    """自定义海报创建模型"""
    pass


class CustomPosterResponse(CustomPosterBase):
    """自定义海报响应模型"""
    id: str

    model_config = ConfigDict(from_attributes=True)
