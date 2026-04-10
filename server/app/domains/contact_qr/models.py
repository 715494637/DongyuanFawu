"""
联系二维码领域 - 数据模型
"""

from sqlalchemy import Column, String, Text
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class ContactQRCode(Base):
    """联系二维码表"""
    __tablename__ = "contact_qr_codes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    image_url = Column(Text)


__all__ = ["ContactQRCode"]
