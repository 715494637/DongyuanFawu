"""
催收记录领域 - 数据模型
"""

from sqlalchemy import Column, String, Text
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class CollectionRecord(Base):
    """催收记录表"""
    __tablename__ = "collection_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    debtor_name = Column(String(100), nullable=False)
    debtor_phone = Column(String(20))
    property_unit = Column(String(200), nullable=False)
    property_area = Column(String(50))
    arrears_amount = Column(String(20), nullable=False, default="0")
    arrears_months = Column(String(10))
    fee_type = Column(String(50))
    collection_status = Column(String(20), default='PENDING')
    last_collection_date = Column(String(20))
    notes = Column(Text)
    history = Column(Text, nullable=True)
    created_at = Column(String(30))
    updated_at = Column(String(30))


__all__ = ["CollectionRecord"]
