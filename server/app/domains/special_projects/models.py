"""
专项服务领域 - 数据模型
"""

from sqlalchemy import Column, String, Text
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class SpecialProject(Base):
    """专项服务表"""
    __tablename__ = "special_projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    description = Column(Text)


__all__ = ["SpecialProject"]
