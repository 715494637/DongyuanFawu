"""
风险场景领域 - Pydantic Schema

定义风险场景相关的数据验证模型
"""

from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, field_validator
from app.utils.logger import logger


class RiskScenarioBase(BaseModel):
    """风险场景基础模型"""
    title: str
    risk_level: Optional[str] = None
    content: Optional[str] = None
    questions: Optional[List[str]] = []

    @field_validator('questions', mode='before')
    @classmethod
    def parse_questions(cls, v: Any) -> List[str]:
        """解析 questions 字段，支持 JSON 字符串或列表"""
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except json.JSONDecodeError as e:
                logger.warning(f"questions 字段 JSON 解析失败: {e}")
                return []
        elif isinstance(v, list):
            return v
        return []


class RiskScenarioCreate(RiskScenarioBase):
    """风险场景创建模型"""
    pass


class RiskScenarioResponse(RiskScenarioBase):
    """风险场景响应模型"""
    id: str

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_questions(cls, obj: Any) -> "RiskScenarioResponse":
        """从 ORM 对象创建响应模型，自动解析 questions 字段"""
        import json
        data = {
            'id': obj.id,
            'title': obj.title,
            'risk_level': obj.risk_level,
            'content': obj.content,
            'questions': json.loads(obj.questions) if obj.questions else []
        }
        return cls(**data)
