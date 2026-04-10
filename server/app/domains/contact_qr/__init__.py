"""
联系二维码领域模块

提供联系二维码的创建、查询和删除等功能
"""

from app.domains.contact_qr.service import ContactQRService
from app.domains.contact_qr.router import router as contact_qr_router

__all__ = ["ContactQRService", "contact_qr_router"]
