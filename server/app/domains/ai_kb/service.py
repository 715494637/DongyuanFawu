"""
AI知识库领域 - 业务逻辑服务
"""

from typing import Optional, List
import json
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.config.service import ConfigService
from app.domains.ai_kb.schemas import ChatRequest
from app.config import settings
from app.utils import logger


# 默认 AI 知识库内容
DEFAULT_AI_KB = """东元法务助手是专业的物业法律服务助手，专注于为物业管理企业提供法律咨询、文书草拟和风险建议。
主要功能包括：
1. 《民法典》相关法律咨询
2. 物业服务合同模板生成
3. 欠费催收法律建议
4. 装修违规处理指导
5. 劳动用工风险提示
6. 消防安全管理合规建议

请用专业、简洁的语言回答用户问题，并在涉及重大法律风险时提醒用户咨询专业律师。"""

# 默认模型
DEFAULT_MODEL = "gemini-3.1-flash-lite-preview"


def parse_gemini_error(error_text: str) -> tuple[str, str]:
    """解析 Gemini API 错误响应，返回 (error_code, error_message)"""
    try:
        error_data = json.loads(error_text)
        error_info = error_data.get("error", {})
        code = error_info.get("code", "UNKNOWN")
        message = error_info.get("message", error_text)
        details = error_info.get("details", [])
        # 尝试获取更详细的错误信息
        for detail in details:
            if detail.get("reason"):
                message = f"{message}: {detail.get('reason')}"
        return str(code), message
    except (json.JSONDecodeError, AttributeError):
        return "UNKNOWN", error_text


class AIKnowledgeBaseService:
    """AI知识库业务逻辑服务"""

    @staticmethod
    async def get_ai_kb(db: AsyncSession) -> str:
        """
        获取AI知识库内容

        Args:
            db: 异步数据库会话

        Returns:
            str: AI知识库内容
        """
        return await ConfigService.get_ai_knowledge_base(db, DEFAULT_AI_KB)

    @staticmethod
    async def update_ai_kb(db: AsyncSession, content: str, username: str = None) -> str:
        """
        更新AI知识库内容

        Args:
            db: 异步数据库会话
            content: 知识库内容
            username: 操作用户名（用于日志）

        Returns:
            str: 更新后的知识库内容
        """
        logger.info(f"管理员 {username} 更新了 AI 知识库，内容长度: {len(content)}")
        await ConfigService.update_ai_knowledge_base(db, content)
        return content

    @staticmethod
    async def chat(request: ChatRequest) -> dict:
        """
        AI 聊天（使用 Gemini API）

        Args:
            request: 聊天请求

        Returns:
            dict: 包含 AI 回复的字典
        """
        api_key = settings.gemini_api_key
        base_url = settings.gemini_base_url
        model = DEFAULT_MODEL

        if not api_key:
            logger.error("Gemini API Key 未配置")
            return {"response": "AI 服务暂不可用，请联系管理员配置 API Key", "model": model}

        # 构建消息内容
        contents = []
        if request.history:
            for msg in request.history:
                contents.append({
                    "role": msg.role,
                    "parts": [{"text": msg.content}]
                })
        # 添加当前消息
        contents.append({
            "role": "user",
            "parts": [{"text": request.message}]
        })

        # 构建请求体
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 8192
            }
        }

        # 构建 API URL
        url = f"{base_url}/v1beta/models/{model}:generateContent"

        logger.info(f"调用 Gemini API: {url}")

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": api_key
                    }
                )
                response.raise_for_status()
                data = response.json()

                # 解析响应
                text = ""
                if data.get("candidates"):
                    candidate = data["candidates"][0]
                    if candidate.get("content"):
                        content = candidate["content"]
                        if content.get("parts"):
                            text = content["parts"][0].get("text", "")

                logger.info(f"Gemini API 响应成功，内容长度: {len(text)}")
                return {"response": text, "model": model, "error": None, "error_code": None}

        except httpx.HTTPStatusError as e:
            error_code, error_message = parse_gemini_error(e.response.text)
            logger.error(f"Gemini API HTTP 错误: {e.response.status_code} - {error_message}")
            return {
                "response": f"AI 服务暂时不可用（HTTP {e.response.status_code}）",
                "model": model,
                "error": error_message,
                "error_code": error_code
            }
        except Exception as e:
            logger.error(f"Gemini API 调用失败: {str(e)}")
            return {"response": "AI 服务暂时不可用，请稍后再试", "model": model, "error": str(e), "error_code": "INTERNAL_ERROR"}

    @staticmethod
    async def speech_to_text(audio_data: bytes, mime_type: str = "audio/webm") -> dict:
        """
        语音转文字（使用 Gemini API multimodal）
        注意：使用 gemini-3.1-flash-lite-preview 统一模型

        Args:
            audio_data: 音频二进制数据
            mime_type: 音频 MIME 类型

        Returns:
            dict: 包含识别文字的字典
        """
        import base64

        api_key = settings.gemini_api_key
        base_url = settings.gemini_base_url
        model = "gemini-3.1-flash-lite-preview"

        if not api_key:
            logger.error("Gemini API Key 未配置")
            return {"text": "", "error": "AI 服务暂不可用，请联系管理员配置 API Key"}

        audio_b64 = base64.b64encode(audio_data).decode("utf-8")

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": audio_b64
                            }
                        },
                        {
                            "text": "请将上面的音频内容转录为文字。只输出转录的文字内容，不要添加任何解释或标点以外的额外内容。"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "maxOutputTokens": 4096
            }
        }

        url = f"{base_url}/v1beta/models/{model}:generateContent"
        logger.info(f"调用 Gemini 语音转文字 API，音频大小: {len(audio_data)} bytes, 模型: {model}")

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": api_key
                    }
                )
                response.raise_for_status()
                data = response.json()

                text = ""
                if data.get("candidates"):
                    candidate = data["candidates"][0]
                    if candidate.get("content"):
                        content = candidate["content"]
                        if content.get("parts"):
                            text = content["parts"][0].get("text", "").strip()

                logger.info(f"语音转文字成功，文字长度: {len(text)}")
                return {"text": text, "error": None}

        except httpx.HTTPStatusError as e:
            error_code, error_message = parse_gemini_error(e.response.text)
            logger.error(f"语音转文字 HTTP 错误: {e.response.status_code} - {error_message}")
            return {"text": "", "error": f"语音识别失败（HTTP {e.response.status_code}）: {error_message}"}
        except Exception as e:
            logger.error(f"语音转文字失败: {str(e)}")
            return {"text": "", "error": f"语音识别失败：{str(e)}"}
