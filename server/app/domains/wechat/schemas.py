"""
微信公众号 Pydantic Schemas

定义 API 请求和响应的数据模型
"""

from typing import Dict
from pydantic import BaseModel


class JsapiConfigResponse(BaseModel):
    """微信 JS-SDK 配置响应"""

    appId: str
    timestamp: str
    nonceStr: str
    signature: str


class JsapiConfigRequest(BaseModel):
    """微信 JS-SDK 配置请求"""

    url: str
