import sys
import os
from pathlib import Path
from loguru import logger
import logging

# 确保日志目录存在
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# 移除 loguru 默认的处理器
logger.remove()

# 控制台输出处理器
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
           "<level>{level: <8}</level> | "
           "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
           "<level>{message}</level>",
    level="DEBUG",
    colorize=True
)

# 应用日志文件处理器 (INFO及以上级别)
logger.add(
    LOG_DIR / "app.log",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="INFO",
    rotation="10 MB",
    retention="30 days",
    compression="zip",
    encoding="utf-8"
)

# 错误日志文件处理器 (ERROR及以上级别)
logger.add(
    LOG_DIR / "error.log",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="ERROR",
    rotation="10 MB",
    retention="30 days",
    compression="zip",
    encoding="utf-8"
)

# 配置标准 logging 模块与 loguru 的集成
class InterceptHandler(logging.Handler):
    """拦截标准 logging 的消息并转发到 loguru"""

    def emit(self, record):
        # 获取对应的 loguru 日志级别
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # 获取日志消息
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )

def setup_logging(debug_mode: bool = False):
    """
    设置日志系统，兼容原有 API

    Args:
        debug_mode: 是否启用调试模式
    """
    # 设置标准 logging 模块
    logging.basicConfig(
        level=logging.DEBUG if debug_mode else logging.INFO,
        handlers=[InterceptHandler()],
        force=True
    )

    # 配置第三方库的日志
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.DEBUG if debug_mode else logging.WARNING
    )

    logger.info("日志系统初始化完成")

# 导出 logger 以兼容原有代码
__all__ = ["logger", "setup_logging"]