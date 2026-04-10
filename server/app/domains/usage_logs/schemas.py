from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UsageLogResponse(BaseModel):
    """使用日志响应模型"""
    id: str
    user_id: str
    username: str
    enterprise_name: str
    feature_id: str
    feature_name: str
    timestamp: int
    timestamp_str: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UsageLogsFilter(BaseModel):
    """使用日志过滤模型"""
    enterprise: Optional[str] = None
    feature: Optional[str] = None
