from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, status
from app.config import settings
from app.utils import logger


def create_access_token(data: dict) -> str:
    """
    创建访问令牌

    Args:
        data: 要编码的数据字典

    Returns:
        str: JWT token字符串
    """
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )

    logger.debug(f"为用户 {data.get('sub')} 创建访问令牌")
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    验证访问令牌

    Args:
        token: JWT token字符串

    Returns:
        dict: 解码后的payload数据

    Raises:
        HTTPException: token无效时抛出
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        logger.debug("Token验证成功")
        return payload
    except JWTError as e:
        logger.warning(f"Token验证失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的Token"
        )