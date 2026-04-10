"""
微信公众号服务模块

提供微信 JS-SDK 签名相关的业务逻辑
"""

import hashlib
import time
import random
import string
from typing import Dict
import httpx
from app.config import settings
from app.utils import logger


class WechatService:
    """微信公众号业务逻辑服务"""

    # 缓存 access_token 和 jsapi_ticket
    _access_token_cache: Dict[str, tuple] = {}  # {token: (access_token, expire_time)}
    _jsapi_ticket_cache: Dict[str, tuple] = {}  # {token: (jsapi_ticket, expire_time)}

    @staticmethod
    def _generate_nonce_str(length: int = 16) -> str:
        """
        生成随机字符串

        Args:
            length: 字符串长度

        Returns:
            str: 随机字符串
        """
        chars = string.ascii_letters + string.digits
        return ''.join(random.choice(chars) for _ in range(length))

    @staticmethod
    def _sha1_sort(params: Dict[str, str]) -> str:
        """
        对参数进行字典序排序并生成 SHA1 签名

        Args:
            params: 参数字典

        Returns:
            str: SHA1 签名
        """
        sorted_params = sorted(params.items())
        string_to_sign = '&'.join([f'{k}={v}' for k, v in sorted_params])
        return hashlib.sha1(string_to_sign.encode('utf-8')).hexdigest()

    @staticmethod
    async def _get_access_token() -> str:
        """
        获取微信 access_token

        Returns:
            str: access_token

        Raises:
            ValueError: 当微信配置未设置时
            Exception: 当获取 access_token 失败时
        """
        if not settings.wechat_app_id or not settings.wechat_app_secret:
            raise ValueError("微信配置未设置，请检查环境变量 WECHAT_APP_ID 和 WECHAT_APP_SECRET")

        # 检查缓存
        cache_key = f"{settings.wechat_app_id}_access_token"
        if cache_key in WechatService._access_token_cache:
            token, expire_time = WechatService._access_token_cache[cache_key]
            if time.time() < expire_time:
                logger.info("使用缓存的 access_token")
                return token

        # 请求微信 API
        url = "https://api.weixin.qq.com/cgi-bin/token"
        params = {
            "grant_type": "client_credential",
            "appid": settings.wechat_app_id,
            "secret": settings.wechat_app_secret
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            if "errcode" in data:
                raise Exception(f"获取 access_token 失败: {data.get('errmsg', 'Unknown error')}")

            access_token = data["access_token"]
            expires_in = data["expires_in"]

            # 缓存 access_token（提前 5 分钟过期）
            expire_time = time.time() + expires_in - 300
            WechatService._access_token_cache[cache_key] = (access_token, expire_time)

            logger.info("获取 access_token 成功")
            return access_token

    @staticmethod
    async def _get_jsapi_ticket(access_token: str) -> str:
        """
        获取微信 jsapi_ticket

        Args:
            access_token: 微信 access_token

        Returns:
            str: jsapi_ticket

        Raises:
            Exception: 当获取 jsapi_ticket 失败时
        """
        # 检查缓存
        cache_key = f"{access_token}_jsapi_ticket"
        if cache_key in WechatService._jsapi_ticket_cache:
            ticket, expire_time = WechatService._jsapi_ticket_cache[cache_key]
            if time.time() < expire_time:
                logger.info("使用缓存的 jsapi_ticket")
                return ticket

        # 请求微信 API
        url = f"https://api.weixin.qq.com/cgi-bin/ticket/getticket"
        params = {
            "access_token": access_token,
            "type": "jsapi"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            if data.get("errcode", 0) != 0:
                raise Exception(f"获取 jsapi_ticket 失败: {data.get('errmsg', 'Unknown error')}")

            jsapi_ticket = data["ticket"]
            expires_in = data["expires_in"]

            # 缓存 jsapi_ticket（提前 5 分钟过期）
            expire_time = time.time() + expires_in - 300
            WechatService._jsapi_ticket_cache[cache_key] = (jsapi_ticket, expire_time)

            logger.info("获取 jsapi_ticket 成功")
            return jsapi_ticket

    @staticmethod
    async def generate_jsapi_config(url: str) -> Dict[str, str]:
        """
        生成微信 JS-SDK 配置

        Args:
            url: 当前页面的完整 URL（不包含 # 及其后面部分）

        Returns:
            Dict[str, str]: 包含 appId, timestamp, nonceStr, signature 的字典

        Raises:
            ValueError: 当微信配置未设置时
            Exception: 当获取签名失败时
        """
        # 获取 access_token
        access_token = await WechatService._get_access_token()

        # 获取 jsapi_ticket
        jsapi_ticket = await WechatService._get_jsapi_ticket(access_token)

        # 生成签名参数
        timestamp = str(int(time.time()))
        nonce_str = WechatService._generate_nonce_str()

        # 生成签名
        sign_params = {
            "jsapi_ticket": jsapi_ticket,
            "noncestr": nonce_str,
            "timestamp": timestamp,
            "url": url
        }
        signature = WechatService._sha1_sort(sign_params)

        logger.info("生成微信 JS-SDK 配置成功")

        return {
            "appId": settings.wechat_app_id,
            "timestamp": timestamp,
            "nonceStr": nonce_str,
            "signature": signature
        }
