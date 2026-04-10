"""
文档领域 - API 路由

提供文档模板和分类的查询、创建、更新和删除等 API 端点
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core import get_current_admin
from app.domains.auth.models import User
from app.domains.documents.schemas import (
    DocumentTemplateCreate,
    DocumentTemplateResponse,
    CategoryCreate,
)
from app.domains.documents.service import DocumentService

router = APIRouter()


@router.get("", response_model=List[DocumentTemplateResponse])
async def get_documents(db: AsyncSession = Depends(get_db)):
    """
    获取所有文档模板列表

    Args:
        db: 异步数据库会话

    Returns:
        List[DocumentTemplate]: 文档模板列表
    """
    return await DocumentService.get_documents(db)


@router.get("/categories", response_model=List[str])
async def get_document_categories(db: AsyncSession = Depends(get_db)):
    """
    获取文档分类列表

    Args:
        db: 异步数据库会话

    Returns:
        List[str]: 分类列表
    """
    return await DocumentService.get_categories(db)


@router.post("", response_model=DocumentTemplateResponse)
async def create_document(
    doc_data: DocumentTemplateCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    创建新的文档模板（仅管理员）

    Args:
        doc_data: 文档模板创建数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        DocumentTemplate: 创建的文档模板对象

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
    """
    return await DocumentService.create_document(db, doc_data)


@router.put("/{doc_id}", response_model=DocumentTemplateResponse)
async def update_document(
    doc_id: str,
    doc_data: DocumentTemplateCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新文档模板（仅管理员）

    Args:
        doc_id: 文档模板ID
        doc_data: 更新数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        DocumentTemplate: 更新后的文档模板对象

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 文档不存在时抛出 404 错误
    """
    return await DocumentService.update_document(db, doc_id, doc_data)


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除文档模板（仅管理员）

    Args:
        doc_id: 文档模板ID
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 删除结果消息

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 文档不存在时抛出 404 错误
    """
    await DocumentService.delete_document(db, doc_id)
    return {"message": "文档删除成功"}


@router.post("/categories")
async def create_category(
    category_data: CategoryCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    新增文档分类（仅管理员）

    Args:
        category_data: 分类创建数据
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 创建结果消息

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 分类名称为空时抛出 400 错误
        HTTPException: 分类已存在时抛出 400 错误
    """
    await DocumentService.create_category(db, category_data.category)
    return {"message": f"分类 '{category_data.category}' 创建成功"}


@router.delete("/categories/{category}")
async def delete_category(
    category: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除文档分类（仅管理员）

    Args:
        category: 分类名称
        current_admin: 当前管理员用户
        db: 异步数据库会话

    Returns:
        dict: 删除结果消息

    Raises:
        HTTPException: 非管理员用户访问时抛出 403 错误
        HTTPException: 不能删除"全部"时抛出 400 错误
        HTTPException: 分类不存在时抛出 404 错误
        HTTPException: 该分类下存在文档时抛出 400 错误
    """
    await DocumentService.delete_category(db, category)
    return {"message": f"分类 '{category}' 删除成功"}
