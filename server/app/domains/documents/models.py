"""
文档领域 - 数据模型

定义文档模板和分类的数据库模型
"""

from sqlalchemy import Column, String, Text, Integer, DateTime
from app.config.database import Base
import uuid
from datetime import datetime


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class DocumentTemplate(Base):
    """文档模板表"""
    __tablename__ = "document_templates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text)
    content = Column(Text)
    file_url = Column(Text)


class DocCategory(Base):
    """文档分类表"""
    __tablename__ = "doc_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


__all__ = ["DocumentTemplate", "DocCategory"]
