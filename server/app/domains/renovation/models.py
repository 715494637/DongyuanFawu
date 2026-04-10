"""
装修巡查领域 - 数据模型
"""

from sqlalchemy import Column, String, Text
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class RenovationRecord(Base):
    """装修巡查记录表"""
    __tablename__ = "renovation_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    property_unit = Column(String(200), nullable=False)
    check_date = Column(String(20))
    check_result = Column(String(20))
    violations = Column(Text)
    images = Column(Text)
    inspector = Column(String(100), nullable=False)
    notes = Column(Text)
    status = Column(String(20), default='PENDING')
    enterprise_name = Column(String(100))
    created_at = Column(String(30))
    updated_at = Column(String(30))


__all__ = ["RenovationRecord"]
