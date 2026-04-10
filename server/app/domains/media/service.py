"""
媒体领域 - 图片上传服务

提供图片上传到 ImageBB 的功能，整合自原 imagebb_service.py 和 image_upload_service.py
"""

import os
import base64
import asyncio
import httpx
from typing import Optional, Dict, Any
from fastapi import HTTPException
from app.config.settings import settings
from app.utils import logger


class MediaService:
    """图片上传服务"""

    def __init__(self):
        self.api_key = settings.imagebb_api_key
        self.api_url = "https://api.imgbb.com/1/upload"

    async def upload_image(self, base64_data: str, name: Optional[str] = None) -> str:
        """
        上传 base64 图片到 ImageBB

        Args:
            base64_data: base64 编码的图片数据（不包含前缀）
            name: 可选的图片名称

        Returns:
            str: 图片 URL

        Raises:
            HTTPException: 上传失败时抛出
        """
        if not self.api_key:
            logger.error("ImageBB API Key 未配置")
            raise HTTPException(status_code=500, detail="ImageBB 服务未配置")

        try:
            # 使用默认名称
            if not name:
                name = f"upload_{int(asyncio.get_event_loop().time())}"

            files = {'image': base64_data}
            data = {
                'key': self.api_key,
                'type': 'base64',
                'name': name
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(self.api_url, files=files, data=data)

                if response.status_code != 200:
                    logger.error(f"ImageBB 上传失败: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"图片上传失败: {response.status_code}"
                    )

                result = response.json()

                if result.get('success'):
                    image_url = result['data']['url']
                    logger.info(f"图片上传成功: {image_url}")
                    return image_url
                else:
                    error_msg = result.get('error', {}).get('message', '未知错误')
                    logger.error(f"ImageBB API 错误: {error_msg}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"图片上传失败: {error_msg}"
                    )

        except httpx.RequestError as e:
            logger.error(f"ImageBB 网络错误: {str(e)}")
            raise HTTPException(status_code=500, detail="网络连接失败")
        except Exception as e:
            logger.error(f"ImageBB 上传异常: {str(e)}")
            raise HTTPException(status_code=500, detail="图片上传服务异常")

    async def upload_file(self, file_path: str, name: Optional[str] = None) -> str:
        """
        上传本地图片文件到 ImageBB

        Args:
            file_path: 本地文件路径
            name: 可选的图片名称

        Returns:
            str: 图片 URL

        Raises:
            HTTPException: 上传失败时抛出
        """
        try:
            with open(file_path, 'rb') as file:
                file_content = file.read()
                base64_data = base64.b64encode(file_content).decode('utf-8')

                if not name:
                    name = os.path.basename(file_path)

                return await self.upload_image(base64_data, name)

        except FileNotFoundError:
            logger.error(f"文件不存在: {file_path}")
            raise HTTPException(status_code=404, detail="文件不存在")
        except Exception as e:
            logger.error(f"文件读取失败: {str(e)}")
            raise HTTPException(status_code=500, detail="文件处理失败")

    async def get_stats(self) -> Dict[str, Any]:
        """
        获取 ImageBB 使用统计

        Returns:
            Dict[str, Any]: 使用统计信息

        Raises:
            HTTPException: 获取失败时抛出
        """
        if not self.api_key:
            raise HTTPException(status_code=500, detail="ImageBB 服务未配置")

        try:
            stats_url = f"https://api.imgbb.com/1/stats?key={self.api_key}"

            async with httpx.AsyncClient() as client:
                response = await client.get(stats_url)

                if response.status_code != 200:
                    logger.error(f"获取 ImageBB 统计失败: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"获取统计失败: {response.status_code}"
                    )

                result = response.json()
                logger.info("ImageBB 统计获取成功")
                return result

        except httpx.RequestError as e:
            logger.error(f"ImageBB 统计网络错误: {str(e)}")
            raise HTTPException(status_code=500, detail="网络连接失败")
        except Exception as e:
            logger.error(f"ImageBB 统计异常: {str(e)}")
            raise HTTPException(status_code=500, detail="统计服务异常")

    @staticmethod
    def extract_base64_data(full_base64: str) -> str:
        """
        从完整的 base64 字符串中提取纯数据

        Args:
            full_base64: 完整的 base64 字符串（如 data:image/jpeg;base64,/9j/4AA...）

        Returns:
            str: 纯 base64 数据
        """
        if ',' in full_base64:
            return full_base64.split(',')[1]
        return full_base64

    @staticmethod
    def is_valid_base64(base64_string: str) -> bool:
        """
        验证 base64 字符串是否有效

        Args:
            base64_string: 要验证的字符串

        Returns:
            bool: 是否有效
        """
        try:
            base64.b64decode(base64_string, validate=True)
            return True
        except Exception:
            return False


# 创建单例实例
media_service = MediaService()
