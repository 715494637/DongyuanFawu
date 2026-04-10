"""
微信公众号领域模块

提供微信 JS-SDK 签名相关的业务逻辑
"""

from app.domains.wechat.service import WechatService
from app.domains.wechat.router import router as wechat_router

__all__ = ["WechatService", "wechat_router"]
