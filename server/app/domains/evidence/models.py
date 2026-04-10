"""
证据清单领域 - 数据模型
"""

from sqlalchemy import Column, String, Text
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class EvidenceList(Base):
    """证据清单表"""
    __tablename__ = "evidence_lists"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    items = Column(Text)


__all__ = ["EvidenceList"]
