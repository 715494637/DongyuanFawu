"""
服务请求领域 - 数据模型
"""

from sqlalchemy import Column, String, Text
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class ServiceRequest(Base):
    """服务请求表"""
    __tablename__ = "service_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    enterprise_name = Column(String(100))
    request_type = Column(String(50), nullable=False)
    title = Column(String(200))
    description = Column(Text, nullable=False)
    status = Column(String(20), default='PENDING')
    priority = Column(String(10), default='NORMAL')
    admin_response = Column(Text)
    resolved_at = Column(String(30))
    created_at = Column(String(30))
    updated_at = Column(String(30))


__all__ = ["ServiceRequest"]
