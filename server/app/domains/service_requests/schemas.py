"""
服务请求领域 - Pydantic Schema
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List


class ServiceRequestBase(BaseModel):
    """服务请求基础模型"""
    request_type: str = Field(..., max_length=50, description="请求类型")
    title: str = Field(..., min_length=1, max_length=200, description="标题")
    description: Optional[str] = Field(None, description="描述内容")
    enterprise_name: Optional[str] = Field(None, max_length=200, description="企业名称")
    status: str = Field(default="PENDING", max_length=20, description="状态")
    priority: Optional[str] = Field(None, max_length=20, description="优先级")
    admin_response: Optional[str] = Field(None, description="管理员回复")


class ServiceRequestCreate(ServiceRequestBase):
    """创建服务请求"""
    pass


class ServiceRequestUpdate(BaseModel):
    """更新服务请求"""
    request_type: Optional[str] = Field(None, max_length=50)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    enterprise_name: Optional[str] = Field(None, max_length=200)
    status: Optional[str] = Field(None, max_length=20)
    priority: Optional[str] = Field(None, max_length=20)
    admin_response: Optional[str] = None


class ServiceRequestResponse(ServiceRequestBase):
    """服务请求响应"""
    id: str
    user_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ServiceRequestListResponse(BaseModel):
    """服务请求列表响应（用户视角）"""
    id: str
    userId: str
    requestType: str
    title: str
    content: Optional[str]
    status: str
    timestamp: int

    model_config = ConfigDict(from_attributes=True)


class ServiceRequestAdminListResponse(BaseModel):
    """服务请求列表响应（管理员视角）"""
    id: str
    userId: str
    username: str
    enterpriseName: Optional[str]
    requestType: str
    title: str
    content: Optional[str]
    status: str
    priority: Optional[str]
    timestamp: int

    model_config = ConfigDict(from_attributes=True)


class ServiceRequestDetailResponse(ServiceRequestBase):
    """服务请求详情响应"""
    id: str
    user_id: str
    created_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
