"""
认证领域 - 数据模型

定义用户相关的数据库模型
"""

from sqlalchemy import Column, String, Boolean, JSON
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class User(Base):
    """用户表"""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    phone_number = Column(String(20), unique=True)
    role = Column(String(10), default='USER')
    enterprise_name = Column(String(100))
    approval_status = Column(String(10), default='PENDING')
    is_certified = Column(Boolean, default=False)
    avatar_url = Column(String(500))
    quota = Column(JSON)


__all__ = ["User"]
