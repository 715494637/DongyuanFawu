"""
自定义海报领域 - 数据模型
"""

from sqlalchemy import Column, String, Text
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class CustomPoster(Base):
    """自定义海报表"""
    __tablename__ = "custom_posters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    image_url = Column(Text)


__all__ = ["CustomPoster"]
