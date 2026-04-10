"""
服务请求领域模块

提供服务请求的创建、查询、更新等功能
"""

from app.domains.service_requests.service import ServiceRequestService
from app.domains.service_requests.router import router as service_requests_router

__all__ = ["ServiceRequestService", "service_requests_router"]
