"""
数据库会话管理模块（异步版本）

提供异步数据库会话的依赖注入函数
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import AsyncSessionLocal
from app.utils import logger


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    获取异步数据库会话的依赖注入函数

    用于 FastAPI 依赖注入系统，为每个请求提供独立的数据库会话

    Yields:
        AsyncSession: 异步数据库会话对象
    """
    db = AsyncSessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"数据库会话异常: {e}")
        await db.rollback()
        raise
    finally:
        await db.close()
