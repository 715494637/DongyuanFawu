"""
异步数据库配置模块

使用 SQLAlchemy 2.0 + aiomysql 实现异步数据库连接
"""

from sqlalchemy import select, text
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings
from app.utils import logger

# ============================================
# 创建异步数据库引擎
# ============================================
async_engine = create_async_engine(
    settings.database_url,
    echo=settings.db_echo,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_recycle=settings.db_pool_recycle,
    pool_pre_ping=True,
)

# 异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# ============================================
# 创建同步数据库引擎（用于迁移脚本等）
# ============================================
sync_url = settings.database_url.replace('aiomysql', 'pymysql')
engine = create_engine(
    sync_url,
    echo=settings.db_echo,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_recycle=settings.db_pool_recycle,
    pool_pre_ping=True,
)

# 同步会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ============================================
# 创建基础模型类
# ============================================
Base = declarative_base()


async def init_db() -> None:
    """
    初始化数据库表结构

    在应用启动时调用，创建所有定义的表
    注意：生产环境建议使用 Alembic 进行数据库迁移
    """
    async with async_engine.begin() as conn:
        # 导入所有域模块的模型以确保它们被注册
        from app.domains.auth import models as auth_models  # noqa: F401
        from app.domains.users import models as users_models  # noqa: F401
        from app.domains.documents import models as documents_models  # noqa: F401
        from app.domains.risks import models as risks_models  # noqa: F401
        from app.domains.evidence import models as evidence_models  # noqa: F401
        from app.domains.civil_code import models as civil_code_models  # noqa: F401
        from app.domains.enterprises import models as enterprises_models  # noqa: F401
        from app.domains.config import models as config_models  # noqa: F401
        from app.domains.posters import models as posters_models  # noqa: F401
        from app.domains.contact_qr import models as contact_qr_models  # noqa: F401
        from app.domains.collections import models as collections_models  # noqa: F401
        from app.domains.scripts import models as scripts_models  # noqa: F401
        from app.domains.sops import models as sops_models  # noqa: F401
        from app.domains.renovation import models as renovation_models  # noqa: F401
        from app.domains.vip import models as vip_models  # noqa: F401
        from app.domains.special_projects import models as special_projects_models  # noqa: F401
        from app.domains.health_check import models as health_check_models  # noqa: F401
        from app.domains.service_requests import models as service_requests_models  # noqa: F401

        # 创建所有表
        await conn.run_sync(Base.metadata.create_all)

        logger.info("数据库表结构初始化完成")


async def close_db() -> None:
    """
    关闭数据库连接

    在应用关闭时调用，优雅地关闭所有数据库连接
    """
    await async_engine.dispose()
    logger.info("数据库连接已关闭")
