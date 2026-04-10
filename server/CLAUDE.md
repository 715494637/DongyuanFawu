# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dong Legal Backend** - 物业法务管理系统后端 API，基于 FastAPI + SQLAlchemy 2.0 (异步) + MySQL 构建，采用领域驱动设计 (DDD) 架构。

## Development Commands

```bash
# 安装依赖 (推荐使用 uv)
uv pip install -r requirements.txt

# 启动开发服务器 (热重载)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 运行测试
pytest

# 运行特定模块测试
pytest app/domains/{module}/tests/

# 带覆盖率报告
pytest --cov=app --cov-report=term-missing
```

## Architecture

### Domain-Driven Design (DDD) Structure

每个业务领域遵循标准结构 (`app/domains/{module}/`):
- `models.py` - SQLAlchemy 数据模型 (异步)
- `schemas.py` - Pydantic 验证模型 (请求/响应 DTO)
- `service.py` - 业务逻辑层
- `router.py` - FastAPI 路由端点

### Dependency Injection Pattern

数据库会话和认证依赖通过 FastAPI 原生 DI 管理:
- `get_db()` - 异步数据库会话
- `get_current_user()` - 验证 JWT Token
- `get_current_admin()` - 仅管理员可访问
- `get_current_approved_user()` - 已审批用户

### Key Directories

| 目录 | 用途 |
|------|------|
| `app/core/` | 认证工具 (JWT)、依赖注入 |
| `app/config/` | 数据库配置、Pydantic Settings |
| `app/db/` | 异步会话管理 |
| `app/utils/` | 日志配置 (Loguru) |

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

## Environment Variables

关键配置项 (`.env`):
- `DATABASE_URL` - MySQL 连接字符串 (aiomysql)
- `SECRET_KEY` - JWT 密钥
- `GEMINI_API_KEY` / `GEMINI_BASE_URL` - Google Gemini AI
- `IMAGEBB_API_KEY` - 图片上传服务
- `WECHAT_APP_ID` / `WECHAT_APP_SECRET` - 微信公众号

## Testing Patterns

```python
# 异步测试示例
@pytest.mark.asyncio
async def test_feature(db: AsyncSession):
    # 测试代码
    pass
```

测试文件位于各 domain 模块的 `tests/` 目录下，使用 `AsyncSession` 进行异步数据库操作。

## Database Initialization

首次运行前确保执行表初始化:
```python
from app.config.database import init_db
await init_db()
```

或在启动时由 `app.main.py` 自动调用 `close_db()` 进行优雅关闭。
