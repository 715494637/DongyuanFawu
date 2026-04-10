"""
文档领域 - 业务逻辑服务

提供文档模板和分类的查询、创建、更新和删除等业务逻辑
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.domains.documents.models import DocumentTemplate, DocCategory
from app.domains.documents.schemas import DocumentTemplateCreate
from app.utils.logger import logger


class DocumentService:
    """文档模板业务逻辑服务"""

    @staticmethod
    async def get_documents(db: AsyncSession) -> List[DocumentTemplate]:
        """
        获取所有文档模板列表

        Args:
            db: 异步数据库会话

        Returns:
            List[DocumentTemplate]: 文档模板列表
        """
        result = await db.execute(select(DocumentTemplate))
        documents = result.scalars().all()
        logger.info(f"获取文档模板列表，共 {len(documents)} 个")
        return documents

    @staticmethod
    async def create_document(db: AsyncSession, doc_data: DocumentTemplateCreate) -> DocumentTemplate:
        """
        创建新的文档模板

        Args:
            db: 异步数据库会话
            doc_data: 文档模板创建数据

        Returns:
            DocumentTemplate: 创建的文档模板对象
        """
        new_doc = DocumentTemplate(
            title=doc_data.title,
            category=doc_data.category,
            description=doc_data.description,
            content=doc_data.content,
            file_url=doc_data.file_url
        )

        db.add(new_doc)
        await db.commit()
        await db.refresh(new_doc)

        logger.info(f"新文档模板 {new_doc.title} 创建成功")
        return new_doc

    @staticmethod
    async def update_document(db: AsyncSession, doc_id: str, doc_data: DocumentTemplateCreate) -> DocumentTemplate:
        """
        更新文档模板

        Args:
            db: 异步数据库会话
            doc_id: 文档模板ID
            doc_data: 更新数据

        Returns:
            DocumentTemplate: 更新后的文档模板对象

        Raises:
            HTTPException: 文档不存在时抛出
        """
        result = await db.execute(select(DocumentTemplate).where(DocumentTemplate.id == doc_id))
        doc = result.scalar_one_or_none()

        if not doc:
            logger.error(f"文档模板 {doc_id} 不存在")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文档不存在")

        # 更新文档模板信息
        doc.title = doc_data.title
        doc.category = doc_data.category
        doc.description = doc_data.description
        doc.content = doc_data.content
        doc.file_url = doc_data.file_url

        await db.commit()
        await db.refresh(doc)

        logger.info(f"文档模板 {doc.title} 更新成功")
        return doc

    @staticmethod
    async def delete_document(db: AsyncSession, doc_id: str) -> None:
        """
        删除文档模板

        Args:
            db: 异步数据库会话
            doc_id: 文档模板ID

        Raises:
            HTTPException: 文档不存在时抛出
        """
        result = await db.execute(select(DocumentTemplate).where(DocumentTemplate.id == doc_id))
        doc = result.scalar_one_or_none()

        if not doc:
            logger.error(f"文档模板 {doc_id} 不存在")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文档不存在")

        title = doc.title
        await db.delete(doc)
        await db.commit()

        logger.info(f"文档模板 {title} 删除成功")

    @staticmethod
    async def get_categories(db: AsyncSession) -> List[str]:
        """
        获取文档分类列表

        Args:
            db: 异步数据库会话

        Returns:
            List[str]: 分类列表
        """
        result = await db.execute(select(DocCategory.name).order_by(DocCategory.name))
        categories = [row[0] for row in result.fetchall() if row[0]]

        # 如果数据库为空，返回默认分类并写入数据库
        default_categories = ["前介承接", "违规整改", "内部管理", "风险防范", "催收增收"]
        if not categories:
            for cat_name in default_categories:
                new_category = DocCategory(name=cat_name)
                db.add(new_category)
            await db.commit()
            categories = default_categories

        # 始终添加"全部"选项在最前面
        return ["全部"] + categories

    @staticmethod
    async def create_category(db: AsyncSession, category_name: str) -> DocCategory:
        """
        新增文档分类

        Args:
            db: 异步数据库会话
            category_name: 分类名称

        Returns:
            DocCategory: 创建的分类对象

        Raises:
            HTTPException: 分类名称为空、已存在或为"全部"时抛出
        """
        if not category_name or not category_name.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="分类名称不能为空")

        category = category_name.strip()

        # 不能创建"全部"分类
        if category == "全部":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能创建'全部'分类")

        # 检查 doc_categories 表中是否已存在
        result = await db.execute(select(DocCategory.name))
        existing_categories = [row[0] for row in result.fetchall() if row[0]]

        if category in existing_categories:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="分类已存在")

        # 插入新分类到 doc_categories 表
        new_category = DocCategory(name=category)
        db.add(new_category)
        await db.commit()
        await db.refresh(new_category)

        logger.info(f"分类 '{category}' 创建成功")
        return new_category

    @staticmethod
    async def delete_category(db: AsyncSession, category_name: str) -> None:
        """
        删除文档分类

        Args:
            db: 异步数据库会话
            category_name: 分类名称

        Raises:
            HTTPException: 分类名称为"全部"、不存在或该分类下存在文档时抛出
        """
        # 不能删除"全部"
        if category_name == "全部":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能删除'全部'分类")

        # 检查该分类下是否有文档
        result = await db.execute(
            select(DocumentTemplate).where(DocumentTemplate.category == category_name)
        )
        docs_with_category = result.scalars().all()

        if docs_with_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"该分类下存在 {len(docs_with_category)} 个文档，无法删除"
            )

        # 从 doc_categories 表中查找并删除分类
        result = await db.execute(
            select(DocCategory).where(DocCategory.name == category_name)
        )
        category_to_delete = result.scalars().first()

        if not category_to_delete:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="分类不存在")

        await db.delete(category_to_delete)
        await db.commit()

        logger.info(f"分类 '{category_name}' 删除成功")
