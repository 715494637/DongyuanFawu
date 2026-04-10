"""
联系二维码业务逻辑服务模块

提供联系二维码的查询、创建和删除等业务逻辑
"""

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.domains.contact_qr.models import ContactQRCode
from app.domains.contact_qr.schemas import ContactQRCodeCreate
from app.utils import logger
from app.domains.media.service import MediaService


class ContactQRService:
    """联系二维码业务逻辑服务"""

    @staticmethod
    async def get_contact_qr(db: AsyncSession) -> List[ContactQRCode]:
        """
        获取所有联系二维码列表

        Args:
            db: 异步数据库会话

        Returns:
            List[ContactQRCode]: 联系二维码列表
        """
        result = await db.execute(select(ContactQRCode))
        qr_codes = result.scalars().all()
        logger.info(f"获取联系二维码列表，共 {len(qr_codes)} 个")
        return qr_codes

    @staticmethod
    async def create_contact_qr(db: AsyncSession, qr_data: ContactQRCodeCreate) -> ContactQRCode:
        """
        创建新的联系二维码

        Args:
            db: 异步数据库会话
            qr_data: 二维码创建数据

        Returns:
            ContactQRCode: 创建的二维码对象
        """
        # 如果提供的是 base64 数据，则上传到 ImageBB
        image_url = qr_data.image_url
        if qr_data.image_url and qr_data.image_url.startswith('data:image'):
            try:
                media_service = MediaService()
                base64_data = MediaService.extract_base64_data(qr_data.image_url)
                image_url = await media_service.upload_image(base64_data, f"qr_{qr_data.name}")
                logger.info(f"二维码图片已上传到 ImageBB: {image_url}")
            except Exception as e:
                logger.error(f"二维码图片上传失败: {str(e)}")
                raise HTTPException(status_code=500, detail=f"图片上传失败: {str(e)}")

        new_qr = ContactQRCode(
            name=qr_data.name,
            image_url=image_url
        )

        db.add(new_qr)
        await db.commit()
        await db.refresh(new_qr)

        logger.info(f"新联系二维码 {new_qr.name} 创建成功")
        return new_qr

    @staticmethod
    async def delete_contact_qr(db: AsyncSession, qr_id: str) -> None:
        """
        删除联系二维码

        Args:
            db: 异步数据库会话
            qr_id: 二维码ID

        Raises:
            HTTPException: 二维码不存在时抛出
        """
        result = await db.execute(select(ContactQRCode).where(ContactQRCode.id == qr_id))
        qr = result.scalar_one_or_none()

        if not qr:
            logger.error(f"联系二维码 {qr_id} 不存在")
            raise HTTPException(status_code=404, detail="二维码不存在")

        name = qr.name
        await db.delete(qr)
        await db.commit()

        logger.info(f"联系二维码 {name} 删除成功")
