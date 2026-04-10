"""
VIP等级领域 - 数据模型
"""

from sqlalchemy import Column, String, Text
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class VipLevel(Base):
    """VIP等级配置表"""
    __tablename__ = "vip_levels"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    level_name = Column(String(50), nullable=False)
    level_code = Column(String(20))
    min_amount = Column(String(20), nullable=False, default="0")
    max_amount = Column(String(20))
    benefits = Column(Text)
    selectable_projects_count = Column(String(10), default="0")
    sort_order = Column(String(10), default="0")
    is_active = Column(String(5), default="1")
    created_at = Column(String(30))
    updated_at = Column(String(30))


__all__ = ["VipLevel"]
