"""
用户管理领域 - 业务逻辑服务

提供用户查询、更新、审批、删除等管理功能
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from fastapi import HTTPException, status
import bcrypt

from app.domains.auth.models import User
from app.domains.auth.schemas import UserUpdate, AdminUserCreate, QuotaUpdate
from app.utils import logger


def get_password_hash(password: str) -> str:
    """密码哈希 - 使用 bcrypt"""
    if not isinstance(password, str):
        password = str(password)
    if not password:
        password = "default"
    password = password[:72]  # bcrypt 限制
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False


class UserService:
    """用户管理业务逻辑服务"""

    @staticmethod
    async def create_user_by_admin(
        db: AsyncSession,
        user_data: AdminUserCreate
    ) -> User:
        """
        管理员创建用户

        Args:
            db: 异步数据库会话
            user_data: 创建用户数据

        Returns:
            User: 创建的用户对象

        Raises:
            HTTPException: 用户名已存在时抛出
        """
        # 检查用户名是否已存在
        result = await db.execute(
            select(User).where(User.username == user_data.username)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="用户名已存在")

        # 检查手机号是否已存在
        if user_data.phone_number:
            result = await db.execute(
                select(User).where(User.phone_number == user_data.phone_number)
            )
            if result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="手机号已存在")

        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            password=hashed_password,
            phone_number=user_data.phone_number,
            role=user_data.role or "USER",
            enterprise_name=user_data.enterprise_name,
            approval_status="APPROVED",
            is_certified=True,
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        logger.info(f"管理员创建用户: {new_user.username}, 角色: {new_user.role}")
        return new_user

    @staticmethod
    async def update_user_quota(
        db: AsyncSession,
        user_id: str,
        quota_data: QuotaUpdate
    ) -> User:
        """
        更新用户额度

        Args:
            db: 异步数据库会话
            user_id: 用户ID
            quota_data: 额度更新数据

        Returns:
            User: 更新后的用户对象

        Raises:
            HTTPException: 用户不存在时抛出
        """
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        current_quota = user.quota or {}

        if quota_data.operation == "set":
            # 直接设置额度
            new_quota = {
                "lawyerLetters": quota_data.lawyer_letters if quota_data.lawyer_letters is not None else current_quota.get("lawyerLetters", 0),
                "consultations": quota_data.consultations if quota_data.consultations is not None else current_quota.get("consultations", 0),
            }
        else:
            # 增量更新
            new_quota = {
                "lawyerLetters": current_quota.get("lawyerLetters", 0) + (quota_data.lawyer_letters or 0),
                "consultations": current_quota.get("consultations", 0) + (quota_data.consultations or 0),
            }

        user.quota = new_quota
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(user, "quota")
        await db.commit()
        await db.refresh(user)

        logger.info(f"用户 {user.username} 额度更新: {new_quota}")
        return user

    @staticmethod
    async def get_all_users(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """
        获取用户列表（支持分页）

        Args:
            db: 异步数据库会话
            skip: 跳过的记录数
            limit: 返回的最大记录数

        Returns:
            List[User]: 用户列表
        """
        result = await db.execute(
            select(User)
            .offset(skip)
            .limit(limit)
        )
        users = result.scalars().all()
        logger.info(f"获取用户列表，共 {len(users)} 个用户 (skip={skip}, limit={limit})")
        return users

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        """
        获取单个用户信息

        Args:
            db: 异步数据库会话
            user_id: 用户ID

        Returns:
            User: 用户对象，不存在返回None
        """
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def approve_user(db: AsyncSession, user_id: str) -> User:
        """
        审批用户

        Args:
            db: 异步数据库会话
            user_id: 用户ID

        Returns:
            User: 审批后的用户对象

        Raises:
            HTTPException: 用户不存在时抛出
        """
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            logger.error(f"用户 {user_id} 不存在")
            raise HTTPException(status_code=404, detail="用户不存在")

        if user.approval_status == "APPROVED":
            logger.warning(f"用户 {user.username} 已经是审批通过状态")
            raise HTTPException(status_code=400, detail="用户已审批")

        user.approval_status = "APPROVED"
        await db.commit()
        await db.refresh(user)

        logger.info(f"用户 {user.username} 审批成功")
        return user

    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: str,
        user_data: UserUpdate,
        is_admin: bool = False
    ) -> User:
        """
        更新用户信息

        Args:
            db: 异步数据库会话
            user_id: 用户ID
            user_data: 更新数据
            is_admin: 是否为管理员

        Returns:
            User: 更新后的用户对象

        Raises:
            HTTPException: 用户不存在或权限不足时抛出
        """
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            logger.error(f"用户 {user_id} 不存在")
            raise HTTPException(status_code=404, detail="用户不存在")

        # 普通用户只能更新用户名、手机号和头像
        if not is_admin:
            allowed_fields = {"username", "phone_number", "avatar_url"}
            for field in user_data.model_dump(exclude_unset=True):
                if field not in allowed_fields:
                    logger.warning(f"普通用户尝试更新禁止字段 {field}")
                    raise HTTPException(status_code=403, detail=f"普通用户不能更新{field}字段")

        # 检查用户名是否已存在（如果要更新的话）
        if user_data.username and user_data.username != user.username:
            result = await db.execute(
                select(User).where(User.username == user_data.username, User.id != user_id)
            )
            if result.scalar_one_or_none():
                logger.warning(f"用户名 {user_data.username} 已存在")
                raise HTTPException(status_code=400, detail="用户名已存在")

        # 更新用户信息
        update_data = user_data.model_dump(exclude_unset=True)

        # 处理密码更新（需要哈希）
        if update_data.get('password'):
            password_value = update_data['password']
            if isinstance(password_value, str) and password_value.strip():
                user.password = get_password_hash(password_value)
            del update_data['password']

        # 更新其他字段
        for field, value in update_data.items():
            setattr(user, field, value)

        await db.commit()
        await db.refresh(user)

        logger.info(f"用户 {user.username} 信息更新成功")
        return user

    @staticmethod
    async def delete_user(db: AsyncSession, user_id: str) -> None:
        """
        删除用户

        Args:
            db: 异步数据库会话
            user_id: 用户ID

        Raises:
            HTTPException: 用户不存在时抛出
        """
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            logger.error(f"用户 {user_id} 不存在")
            raise HTTPException(status_code=404, detail="用户不存在")

        username = user.username
        await db.delete(user)
        await db.commit()

        logger.info(f"用户 {username} 删除成功")

    @staticmethod
    async def get_user_stats(db: AsyncSession) -> dict:
        """
        获取用户统计信息

        Args:
            db: 异步数据库会话

        Returns:
            dict: 包含用户统计信息的字典
                - total_users: 总用户数
                - approved_users: 已审批用户数
                - pending_users: 待审批用户数
                - admin_users: 管理员数量
                - regular_users: 普通用户数量
        """
        result = await db.execute(
            select(
                func.count(User.id).label('total_users'),
                func.sum(case((User.approval_status == "APPROVED", 1), else_=0)).label('approved_users'),
                func.sum(case((User.approval_status == "PENDING", 1), else_=0)).label('pending_users'),
                func.sum(case((User.role == "ADMIN", 1), else_=0)).label('admin_users'),
            )
        )
        row = result.one()

        stats = {
            "total_users": row.total_users,
            "approved_users": row.approved_users or 0,
            "pending_users": row.pending_users or 0,
            "admin_users": row.admin_users or 0,
            "regular_users": (row.total_users or 0) - (row.admin_users or 0)
        }

        logger.info(f"获取用户统计信息: {stats}")
        return stats