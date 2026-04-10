"""
认证领域 - Pydantic Schema

定义认证相关的数据验证模型
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class UserBase(BaseModel):
    """用户基础模型"""
    username: str
    phone_number: Optional[str] = None
    enterprise_name: Optional[str] = None


class UserCreate(UserBase):
    """用户创建模型"""
    password: str


class UserUpdate(BaseModel):
    """用户更新模型"""
    username: Optional[str] = None
    phone_number: Optional[str] = None
    enterprise_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = None
    approval_status: Optional[str] = None


class UserResponse(UserBase):
    """用户响应模型"""
    id: str
    role: str
    approval_status: str
    is_certified: bool
    avatar_url: Optional[str] = None
    quota: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    """登录请求模型"""
    username: str
    password: str


class Token(BaseModel):
    """令牌响应模型"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse