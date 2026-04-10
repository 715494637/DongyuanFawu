"""
风险场景领域 - 数据模型
"""

from sqlalchemy import Column, String, Text
from app.config.database import Base
import uuid


def generate_uuid():
    """生成 UUID 字符串"""
    return str(uuid.uuid4())


class RiskScenario(Base):
    """风险场景表"""
    __tablename__ = "risk_scenarios"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    risk_level = Column(String(10))
    content = Column(Text)
    questions = Column(Text)


__all__ = ["RiskScenario"]
