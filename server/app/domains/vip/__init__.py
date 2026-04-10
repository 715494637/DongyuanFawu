"""
VIP权益领域模块

提供VIP等级配置、企业统计数据、专项服务选择等功能
"""

from app.domains.vip.service import VipService
from app.domains.vip.router import router as vip_router

__all__ = ["VipService", "vip_router"]
