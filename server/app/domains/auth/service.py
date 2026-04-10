"""
认证领域 - 业务逻辑服务

提供用户认证、创建、验证等业务逻辑
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import bcrypt
from app.domains.auth.models import User
from app.domains.auth.schemas import UserCreate
from app.utils import logger


def get_password_hash(password: str) -> str:
    """使用 bcrypt 生成密码哈希"""
    password = str(password)[:72] if password else "default"
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """使用 bcrypt 验证密码"""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False


class AuthService:
    """认证业务逻辑服务"""

    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        username: str,
        password: str
    ) -> Optional[User]:
        """验证用户登录凭据"""
        result = await db.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.password):
            return None

        return user

    @staticmethod
    async def create_user(
        db: AsyncSession,
        user_data: UserCreate
    ) -> User:
        """创建新用户"""
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            password=hashed_password,
            phone_number=user_data.phone_number,
            enterprise_name=user_data.enterprise_name,
            role="USER",
            approval_status="PENDING"
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        logger.info(f"创建新用户: {new_user.username}")
        return new_user

    @staticmethod
    async def get_user_by_username(
        db: AsyncSession,
        username: str
    ) -> Optional[User]:
        """根据用户名查询用户"""
        result = await db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()