"""
应用配置管理模块

使用 Pydantic Settings 进行类型安全的配置管理
支持从环境变量和 .env 文件加载配置
"""

import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    应用配置类

    使用 Pydantic V2 进行类型安全的配置管理
    所有配置都可以通过环境变量或 .env 文件覆盖
    """

    # ============================================
    # 应用基础配置
    # ============================================
    app_name: str = Field(default="东元法务系统API", description="应用名称")
    app_version: str = Field(default="1.0.0", description="应用版本")
    description: str = Field(
        default="物业法务管理系统后端API - 基于 FastAPI + Python 3.13",
        description="应用描述"
    )
    debug: bool = Field(default=False, description="调试模式")

    # ============================================
    # 服务器配置
    # ============================================
    host: str = Field(default="0.0.0.0", description="服务器监听地址")
    port: int = Field(default=8000, description="服务器监听端口")

    # ============================================
    # 数据库配置（异步）
    # ============================================
    database_url: str = Field(
        default="mysql+aiomysql://root:rtkcXFAAdeRD7hhs@43.138.171.198:3306/dong_legal?charset=utf8mb4",
        description="异步数据库连接 URL"
    )

    # 数据库连接池配置（优化版）
    db_pool_size: int = Field(default=10, description="连接池大小（优化: 5→10）")
    db_max_overflow: int = Field(default=20, description="连接池最大溢出数（优化: 10→20）")
    db_pool_timeout: int = Field(default=60, description="连接池超时时间（秒）（优化: 30→60）")
    db_pool_recycle: int = Field(default=3600, description="连接回收时间（秒）")
    db_echo: bool = Field(default=False, description="是否打印 SQL 语句")

    # ============================================
    # JWT 认证配置
    # ============================================
    secret_key: str = Field(
        default="your-secret-key-here-change-in-production",
        description="JWT 密钥（生产环境必须修改）"
    )
    algorithm: str = Field(default="HS256", description="JWT 加密算法")
    access_token_expire_minutes: int = Field(
        default=24 * 60,
        description="访问令牌过期时间（分钟）"
    )

    # ============================================
    # CORS 配置
    # ============================================
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://localhost:3000"
        ],
        description="允许的 CORS 源"
    )

    # ============================================
    # 日志配置
    # ============================================
    log_level: str = Field(default="INFO", description="日志级别")
    log_rotation: str = Field(default="10 MB", description="日志轮转大小")
    log_retention: str = Field(default="30 days", description="日志保留时间")
    log_compression: str = Field(default="zip", description="日志压缩格式")

    # ============================================
    # ImageBB 图片上传配置
    # ============================================
    imagebb_api_key: str = Field(default="", description="ImageBB API 密钥")

    # ============================================
    # 通义千问 Qwen AI 配置
    # ============================================
    qwen_api_key: str = Field(default="", description="通义千问 API 密钥")
    qwen_base_url: str = Field(default="https://dashscope.aliyuncs.com/compatible-mode/v1", description="通义千问 API 基础 URL")

    # ============================================
    # 微信公众号配置
    # ============================================
    wechat_app_id: str = Field(default="", description="微信公众号 AppID")
    wechat_app_secret: str = Field(default="", description="微信公众号 AppSecret")

    # ============================================
    # Pydantic V2 配置
    # ============================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # 忽略额外的环境变量
    )


# 创建全局配置实例
settings = Settings()