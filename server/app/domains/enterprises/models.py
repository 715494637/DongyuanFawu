"""
企业领域 - 数据模型
"""

from sqlalchemy import Column, String, Text
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class Enterprise(Base):
    """企业表"""
    __tablename__ = "enterprises"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)


class EnterpriseStats(Base):
    """企业统计数据表"""
    __tablename__ = "enterprise_stats"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    enterprise_name = Column(String(100), unique=True, nullable=False, index=True)
    total_cases = Column(String(10), default="0")
    resolved_cases = Column(String(10), default="0")
    total_arrears = Column(String(20), default="0")
    collected_amount = Column(String(20), default="0")
    collection_rate = Column(String(10), default="0")
    last_calculated_date = Column(String(20))
    created_at = Column(String(30))
    updated_at = Column(String(30))


__all__ = ["Enterprise", "EnterpriseStats"]
