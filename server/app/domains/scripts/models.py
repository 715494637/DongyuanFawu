"""
话术库领域 - 数据模型
"""

from sqlalchemy import Column, String, JSON
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class Script(Base):
    """话术库表"""
    __tablename__ = "scripts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    category = Column(String(50))
    steps = Column(JSON)
    is_active = Column(String(5), default="1")
    created_at = Column(String(30))
    updated_at = Column(String(30))


__all__ = ["Script"]
