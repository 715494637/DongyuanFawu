"""
民法典领域 - 业务逻辑服务
"""

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.domains.civil_code.models import CivilCodeArticle
from app.domains.civil_code.schemas import CivilCodeArticleCreate
from app.utils.logger import logger


class CivilCodeService:
    """民法典业务逻辑服务"""

    @staticmethod
    async def get_civil_code(db: AsyncSession) -> List[CivilCodeArticle]:
        """
        获取所有民法典条文列表

        Args:
            db: 异步数据库会话

        Returns:
            List[CivilCodeArticle]: 民法典条文列表
        """
        result = await db.execute(select(CivilCodeArticle))
        articles = result.scalars().all()
        logger.info(f"获取民法典条文列表，共 {len(articles)} 条")
        return articles

    @staticmethod
    async def create_civil_code(
        db: AsyncSession,
        article_data: CivilCodeArticleCreate
    ) -> CivilCodeArticle:
        """
        创建新的民法典条文

        Args:
            db: 异步数据库会话
            article_data: 民法典条文创建数据

        Returns:
            CivilCodeArticle: 创建的民法典条文对象
        """
        new_article = CivilCodeArticle(
            title=article_data.title,
            content=article_data.content
        )

        db.add(new_article)
        await db.commit()
        await db.refresh(new_article)

        logger.info(f"新民法典条文 {new_article.title} 创建成功")
        return new_article

    @staticmethod
    async def update_civil_code(
        db: AsyncSession,
        article_id: str,
        article_data: CivilCodeArticleCreate
    ) -> CivilCodeArticle:
        """
        更新民法典条文

        Args:
            db: 异步数据库会话
            article_id: 民法典条文ID
            article_data: 更新数据

        Returns:
            CivilCodeArticle: 更新后的民法典条文对象

        Raises:
            HTTPException: 民法典条文不存在时抛出
        """
        result = await db.execute(
            select(CivilCodeArticle).where(CivilCodeArticle.id == article_id)
        )
        article = result.scalar_one_or_none()

        if not article:
            logger.error(f"民法典条文 {article_id} 不存在")
            raise HTTPException(status_code=404, detail="民法典条文不存在")

        article.title = article_data.title
        article.content = article_data.content

        await db.commit()
        await db.refresh(article)

        logger.info(f"民法典条文 {article.title} 更新成功")
        return article

    @staticmethod
    async def delete_civil_code(db: AsyncSession, article_id: str) -> None:
        """
        删除民法典条文

        Args:
            db: 异步数据库会话
            article_id: 民法典条文ID

        Raises:
            HTTPException: 民法典条文不存在时抛出
        """
        result = await db.execute(
            select(CivilCodeArticle).where(CivilCodeArticle.id == article_id)
        )
        article = result.scalar_one_or_none()

        if not article:
            logger.error(f"民法典条文 {article_id} 不存在")
            raise HTTPException(status_code=404, detail="民法典条文不存在")

        title = article.title
        await db.delete(article)
        await db.commit()

        logger.info(f"民法典条文 {title} 删除成功")
