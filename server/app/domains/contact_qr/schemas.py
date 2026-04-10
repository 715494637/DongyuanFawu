"""
联系二维码领域 - Pydantic Schema
"""

from pydantic import BaseModel, ConfigDict


class ContactQRCodeBase(BaseModel):
    """联系二维码基础模型"""
    name: str
    image_url: str  # 存储图片 URL


class ContactQRCodeCreate(ContactQRCodeBase):
    """联系二维码创建模型"""
    pass


class ContactQRCode(ContactQRCodeBase):
    """联系二维码响应模型"""
    id: str

    model_config = ConfigDict(from_attributes=True)
