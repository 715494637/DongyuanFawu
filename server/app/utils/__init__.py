"""
工具模块

导出日志工具函数，简化导入路径
"""

from app.utils.logger import logger, setup_logging

__all__ = [
    "logger",
    "setup_logging"
]