"""
认证领域 - API 路由

提供登录、注册等认证相关的 API 端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core import create_access_token, get_current_user
from app.core.dependencies import get_current_approved_user
from app.domains.auth.schemas import (
    LoginRequest,
    Token,
    UserCreate,
    UserResponse,
)
from app.domains.auth.service import AuthService
from app.domains.auth.models import User
from app.utils import logger

# 默认用户协议内容
DEFAULT_AGREEMENT = """【东元法务通 · 用户服务协议及免责声明】
1. 本平台提供的所有法律建议、文书模板（含AI生成内容）仅供参考，不构成具有法律效力的正式法律意见书。
2. 涉及重大财产处分、人身安全及诉讼程序的，请务必咨询专业律师。
3. 用户应确保录入的业务数据（如欠费金额、业主信息）的真实性，因数据错误导致的法律后果由用户自行承担。
4. 禁止利用本平台从事任何违法违规活动。"""

router = APIRouter()


@router.get("/agreement")
async def get_agreement():
    """获取用户服务协议内容（公开接口）"""
    return {"agreement": DEFAULT_AGREEMENT}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前登录用户信息"""
    return UserResponse.model_validate(current_user)


@router.post("/login", response_model=Token, tags=["认证"])
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    用户登录

    API 兼容性：路径 /api/v1/auth/login 保持不变
    """
    logger.info(f"用户登录请求: {request.username}")

    user = await AuthService.authenticate_user(db, request.username, request.password)
    if not user:
        logger.warning(f"用户 {request.username} 登录失败：用户名或密码错误")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )

    if user.approval_status != "APPROVED" and user.role != "ADMIN":
        logger.warning(f"用户 {request.username} 登录失败：账号未通过审批")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号未通过审批"
        )

    token_data = {"sub": user.id, "role": user.role}
    access_token = create_access_token(token_data)

    logger.info(f"用户 {request.username} 登录成功")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }


@router.post("/register", tags=["认证"])
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    用户注册

    API 兼容性：路径 /api/v1/auth/register 保持不变
    """
    logger.info(f"用户注册请求: {user_data.username}")

    # 检查用户名是否存在
    existing = await AuthService.get_user_by_username(db, user_data.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )

    new_user = await AuthService.create_user(db, user_data)

    return {"message": "注册成功，等待管理员审批"}


@router.post("/send-sms", tags=["认证"])
async def send_sms(phone: str):
    """发送短信验证码（模拟实现）"""
    logger.info(f"模拟发送短信验证码到: {phone}")
    return {"message": "验证码已发送"}