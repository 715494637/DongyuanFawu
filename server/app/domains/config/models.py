"""
系统配置领域 - 数据模型
"""

from sqlalchemy import Column, String, Text, Boolean
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class SystemConfig(Base):
    """系统配置表"""
    __tablename__ = "system_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    enable_phone_login = Column(Boolean, default=True)
    welcome_message = Column(Text)
    ai_knowledge_base = Column(Text)
    enterprise_logo = Column(Text)
    splash_image = Column(Text)
    enable_splash_screen = Column(Boolean, default=True)
    renovation_items = Column(Text)
    lawyer_phone_number = Column(String(50))


# 别名，用于向后兼容
SystemConfigModel = SystemConfig

__all__ = ["SystemConfig", "SystemConfigModel"]
