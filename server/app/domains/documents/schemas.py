"""
文档领域 - Pydantic Schema

定义文档模板和分类相关的验证模型
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class CategoryCreate(BaseModel):
    """分类创建模型"""
    category: str = Field(..., description="分类名称")


class DocumentTemplateBase(BaseModel):
    """文档模板基础模型"""
    title: str
    category: str
    description: Optional[str] = None
    content: Optional[str] = None
    file_url: Optional[str] = None


class DocumentTemplateCreate(DocumentTemplateBase):
    """文档模板创建模型"""
    pass


class DocumentTemplateResponse(DocumentTemplateBase):
    """文档模板响应模型"""
    id: str
    file_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DocCategoryResponse(BaseModel):
    """文档分类响应模型"""
    id: int
    name: str
    created_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
