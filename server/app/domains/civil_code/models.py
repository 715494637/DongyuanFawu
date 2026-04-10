"""
民法典领域 - 数据模型
"""

from sqlalchemy import Column, String, Text
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class CivilCodeArticle(Base):
    """民法典条文表"""
    __tablename__ = "civil_code_articles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)


__all__ = ["CivilCodeArticle"]
