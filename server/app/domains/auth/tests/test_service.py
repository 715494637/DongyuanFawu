"""
认证领域 - 业务逻辑测试
"""

import pytest
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from app.domains.auth.service import AuthService
from app.domains.auth.schemas import UserCreate


@pytest.mark.asyncio
async def test_authenticate_user_success(db: AsyncSession):
    """测试成功的用户认证"""
    # 使用唯一的用户名避免冲突
    unique_id = str(uuid.uuid4())[:8]
    username = f"testuser_{unique_id}"

    # 先创建一个用户
    user_data = UserCreate(
        username=username,
        password="testpass123",
        enterprise_name="Test Enterprise"
    )
    created_user = await AuthService.create_user(db, user_data)

    # 验证认证成功
    authenticated = await AuthService.authenticate_user(
        db,
        username,
        "testpass123"
    )

    assert authenticated is not None
    assert authenticated.id == created_user.id
    assert authenticated.username == username

    # 清理测试数据
    await db.execute(delete(created_user.__class__).where(created_user.__class__.id == created_user.id))
    await db.commit()


@pytest.mark.asyncio
async def test_authenticate_user_wrong_password(db: AsyncSession):
    """测试错误的密码"""
    unique_id = str(uuid.uuid4())[:8]
    username = f"testuser2_{unique_id}"

    user_data = UserCreate(
        username=username,
        password="correctpass",
        enterprise_name="Test Enterprise"
    )
    created_user = await AuthService.create_user(db, user_data)

    # 验证错误密码认证失败
    authenticated = await AuthService.authenticate_user(
        db,
        username,
        "wrongpass"
    )

    assert authenticated is None

    # 清理测试数据
    await db.execute(delete(created_user.__class__).where(created_user.__class__.id == created_user.id))
    await db.commit()


@pytest.mark.asyncio
async def test_authenticate_user_not_exists(db: AsyncSession):
    """测试不存在的用户"""
    authenticated = await AuthService.authenticate_user(
        db,
        "nonexistent",
        "anypass"
    )

    assert authenticated is None


@pytest.mark.asyncio
async def test_create_user(db: AsyncSession):
    """测试创建用户"""
    unique_id = str(uuid.uuid4())[:8]
    username = f"newuser_{unique_id}"

    user_data = UserCreate(
        username=username,
        password="securepass",
        phone_number="13800138000",
        enterprise_name="New Enterprise"
    )

    user = await AuthService.create_user(db, user_data)

    assert user.id is not None
    assert user.username == username
    assert user.role == "USER"
    assert user.approval_status == "PENDING"
    assert user.password != "securepass"  # 密码应该被哈希

    # 清理测试数据
    await db.execute(delete(user.__class__).where(user.__class__.id == user.id))
    await db.commit()