"""
证据清单领域 - Pydantic Schema
"""

from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict, field_validator, model_validator
import json


class EvidenceListBase(BaseModel):
    """证据清单基础模型"""
    title: str
    items: Optional[List[str]] = []

    @field_validator('items', mode='before')
    @classmethod
    def parse_items(cls, v: Any) -> List[str]:
        """解析 items 字段，支持 JSON 字符串或列表"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        elif isinstance(v, list):
            return v
        return []


class EvidenceListCreate(EvidenceListBase):
    """证据清单创建模型"""
    pass


class EvidenceListResponse(EvidenceListBase):
    """证据清单响应模型"""
    id: str

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='before')
    @classmethod
    def validate_items(cls, data: Any) -> Any:
        """验证并转换 items 字段，将 JSON 字符串转换为列表"""
        if isinstance(data, dict) and 'items' in data:
            if isinstance(data['items'], str):
                try:
                    data['items'] = json.loads(data['items'])
                except:
                    data['items'] = []
        return data
