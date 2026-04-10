from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UsageLogModel(BaseModel):
    """使用日志数据模型（用于内存存储）"""
    id: str
    user_id: str
    username: str
    enterprise_name: str
    feature_id: str
    feature_name: str
    timestamp: int
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }
