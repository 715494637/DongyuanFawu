"""
微信公众号 API 路由

提供微信 JS-SDK 签名接口，用于配置微信分享功能
"""

from fastapi import APIRouter
from app.domains.wechat.service import WechatService

router = APIRouter()


@router.get("/jsapi-config")
async def get_jsapi_config(url: str):
    """
    获取微信 JS-SDK 签名配置

    Args:
        url: 当前页面的完整 URL（不包含 # 及其后面部分）

    Returns:
        包含 appId, timestamp, nonceStr, signature 的字典
    """
    return await WechatService.generate_jsapi_config(url)
