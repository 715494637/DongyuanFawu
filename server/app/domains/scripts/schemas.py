"""
话术库领域 - Pydantic Schema
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any


class ScriptBase(BaseModel):
    """话术库基础模型"""
    title: str
    category: Optional[str] = None
    steps: Optional[List[Dict[str, Any]]] = None


class ScriptCreate(ScriptBase):
    """创建话术"""
    pass


class ScriptUpdate(BaseModel):
    """更新话术"""
    title: Optional[str] = None
    category: Optional[str] = None
    steps: Optional[List[Dict[str, Any]]] = None


class ScriptResponse(ScriptBase):
    """话术响应"""
    id: str
    is_active: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
