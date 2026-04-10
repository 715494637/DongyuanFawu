"""
数据库模块

导出数据库会话和依赖注入函数，简化导入路径
"""

from app.db.session import get_db

__all__ = [
    "get_db",
]