"""
FastAPI 应用主入口模块

东元法物后端 API 服务 - 基于 FastAPI + Python 3.13 + MySQL + aiomysql
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
import time

from app.config import settings, init_db, close_db
from app.utils import logger

# 导入领域路由
from app.domains.auth.router import router as auth_router
from app.domains.users.router import router as users_router
from app.domains.collections.router import router as collections_router
from app.domains.documents.router import router as documents_router
from app.domains.renovation.router import router as renovation_router
from app.domains.evidence.router import router as evidence_router
from app.domains.sops.router import router as sops_router
from app.domains.risks.router import router as risks_router
from app.domains.service_requests.router import router as service_requests_router
from app.domains.civil_code.router import router as civil_code_router
from app.domains.enterprises.router import router as enterprises_router
from app.domains.health_check.router import router as health_check_router
from app.domains.contact_qr.router import router as contact_qr_router
from app.domains.scripts.router import router as scripts_router, collection_router
from app.domains.special_projects.router import router as special_projects_router
from app.domains.vip.router import router as vip_router
from app.domains.posters.router import router as posters_router
from app.domains.config.router import router as config_router
from app.domains.ai_kb.router import router as ai_kb_router
from app.domains.usage_logs.router import router as usage_logs_router
from app.domains.wechat.router import router as wechat_router


# ============================================
# 应用生命周期管理
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info(f"{settings.app_name} 正在启动...")
    await init_db()
    logger.info(f"{settings.app_name} 启动完成")

    yield

    logger.info(f"{settings.app_name} 正在关闭...")
    await close_db()
    logger.info(f"{settings.app_name} 已关闭")


# ============================================
# 创建 FastAPI 应用
# ============================================
app = FastAPI(
    title=settings.app_name,
    description=settings.description,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
    validate_response=False
)

# ============================================
# 配置 CORS
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# 全局异常处理器
# ============================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器"""
    logger.error("=" * 60)
    logger.error("全局异常捕获")
    logger.error(f"请求路径: {request.url}")
    logger.error(f"请求方法: {request.method}")
    logger.error(f"异常类型: {type(exc).__name__}")
    logger.error(f"异常信息: {exc}")
    logger.error(f"详细堆栈:\n{traceback.format_exc()}")
    logger.error("=" * 60)

    return JSONResponse(
        status_code=500,
        content={
            "detail": "内部服务器错误",
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "timestamp": time.time()
        }
    )


# ============================================
# 请求日志中间件
# ============================================
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """请求日志中间件"""
    start_time = time.time()
    logger.info(f"请求开始: {request.method} {request.url}")

    response = await call_next(request)

    process_time = time.time() - start_time
    logger.info(
        f"请求完成: {request.method} {request.url} - "
        f"状态码: {response.status_code} - 耗时: {process_time:.3f}s"
    )

    return response


# ============================================
# 注册 API 路由
# ============================================
# 认证相关
app.include_router(auth_router, prefix="/api/v1/auth", tags=["认证"])

# 用户管理
app.include_router(users_router, prefix="/api/v1/users", tags=["用户管理"])

# 催收记录
app.include_router(collections_router, prefix="/api/v1/collections", tags=["催收记录"])

# 文档模板
app.include_router(documents_router, prefix="/api/v1/documents", tags=["文档模板"])

# 装修巡查
app.include_router(renovation_router, prefix="/api/v1/renovation", tags=["装修巡查"])

# 证据清单
app.include_router(evidence_router, prefix="/api/v1/evidence", tags=["证据清单"])

# 服务请求
app.include_router(service_requests_router, prefix="/api/v1/service-requests", tags=["服务请求"])

# 应急预案
app.include_router(sops_router, prefix="/api/v1/sops", tags=["应急预案"])

# 民法典
app.include_router(civil_code_router, prefix="/api/v1/civil-code", tags=["民法典"])

# 风险场景
app.include_router(risks_router, prefix="/api/v1/risks", tags=["风险场景"])

# 物业公司
app.include_router(enterprises_router, prefix="/api/v1/enterprises", tags=["物业公司"])

# 法务体检
app.include_router(health_check_router, prefix="/api/v1/health-check", tags=["法务体检"])

# 联系二维码
app.include_router(contact_qr_router, prefix="/api/v1/contact-qr", tags=["联系二维码"])

# 话术库
app.include_router(scripts_router, prefix="/api/v1/scripts", tags=["话术库"])

# 催收话术库（用户端只读）
app.include_router(collection_router, prefix="/api/v1", tags=["催收话术库"])

# 专项服务
app.include_router(special_projects_router, prefix="/api/v1/special-projects", tags=["专项服务"])

# VIP权益
app.include_router(vip_router, prefix="/api/v1/vip", tags=["VIP权益"])

# 自定义海报
app.include_router(posters_router, prefix="/api/v1/posters", tags=["自定义海报"])

# 系统配置
app.include_router(config_router, prefix="/api/v1/config", tags=["系统配置"])

# AI知识库
app.include_router(ai_kb_router, prefix="/api/v1/ai-kb", tags=["AI知识库"])

# AI聊天（使用独立前缀）
from app.domains.ai_kb.router import chat_router
app.include_router(chat_router, prefix="/api/v1/ai", tags=["AI聊天"])

# 使用日志
app.include_router(usage_logs_router, prefix="/api/v1/usage-logs", tags=["使用日志"])

# 微信公众号
app.include_router(wechat_router, prefix="/api/v1/wechat", tags=["微信公众号"])


# ============================================
# 根路由
# ============================================
@app.get("/", tags=["根路由"])
async def root():
    """根路由"""
    return {
        "message": f"{settings.app_name} 正在运行",
        "version": settings.app_version,
        "status": "healthy"
    }


# ============================================
# 健康检查
# ============================================
@app.get("/health", tags=["健康检查"])
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "version": settings.app_version,
        "service": settings.app_name
    }


# ============================================
# 直接运行
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )