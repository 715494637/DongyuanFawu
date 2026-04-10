import json
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.config.models import SystemConfigModel
from app.domains.config.schemas import SystemConfigUpdate, RenovationItemsUpdate
from app.utils import logger


class ConfigService:
    """系统配置业务逻辑服务"""

    @staticmethod
    async def get_config(db: AsyncSession) -> SystemConfigModel:
        """
        获取系统配置

        Args:
            db: 异步数据库会话

        Returns:
            SystemConfigModel: 系统配置对象
        """
        result = await db.execute(select(SystemConfigModel))
        config = result.scalar_one_or_none()

        if not config:
            # 创建默认配置
            config = SystemConfigModel(
                enable_phone_login=True,
                welcome_message="您好！我是东元物业法务助手。我可以为您提供《民法典》咨询、文书草拟及风险建议。（回答仅供参考）"
            )
            db.add(config)
            await db.commit()
            await db.refresh(config)
            logger.info("创建默认系统配置")

        logger.info("获取系统配置")
        return config

    @staticmethod
    async def update_config(db: AsyncSession, config_data: SystemConfigUpdate) -> None:
        """
        更新系统配置

        Args:
            db: 异步数据库会话
            config_data: 更新数据
        """
        result = await db.execute(select(SystemConfigModel))
        config = result.scalar_one_or_none()

        if not config:
            config = SystemConfigModel()
            db.add(config)

        # 更新配置信息
        for key, value in config_data.model_dump(exclude_unset=True).items():
            setattr(config, key, value)

        await db.commit()
        logger.info("系统配置更新成功")

    @staticmethod
    async def get_splash_image(db: AsyncSession) -> Optional[str]:
        """
        获取开屏图

        Args:
            db: 异步数据库会话

        Returns:
            Optional[str]: 开屏图URL，不存在返回None
        """
        result = await db.execute(select(SystemConfigModel))
        config = result.scalar_one_or_none()

        if config and config.splash_image:
            logger.info("获取开屏图")
            return config.splash_image

        logger.info("开屏图不存在")
        return None

    @staticmethod
    async def upload_splash_image(db: AsyncSession, splash_data: dict) -> None:
        """
        上传开屏图

        Args:
            db: 异步数据库会话
            splash_data: 包含开屏图数据的字典
        """
        result = await db.execute(select(SystemConfigModel))
        config = result.scalar_one_or_none()

        if not config:
            config = SystemConfigModel()
            db.add(config)

        config.splash_image = splash_data.get("splash_image")
        await db.commit()
        logger.info("开屏图上传成功")

    @staticmethod
    async def delete_splash_image(db: AsyncSession) -> None:
        """
        删除开屏图

        Args:
            db: 异步数据库会话
        """
        result = await db.execute(select(SystemConfigModel))
        config = result.scalar_one_or_none()

        if config:
            config.splash_image = None
            await db.commit()
            logger.info("开屏图删除成功")
        else:
            logger.warning("系统配置不存在，无需删除开屏图")

    @staticmethod
    async def get_renovation_items(db: AsyncSession) -> List[str]:
        """
        获取装修巡查项配置

        Args:
            db: 异步数据库会话

        Returns:
            List[str]: 装修巡查项列表
        """
        result = await db.execute(select(SystemConfigModel))
        config = result.scalar_one_or_none()

        if config and config.renovation_items:
            try:
                items = json.loads(config.renovation_items)
                if isinstance(items, list):
                    return items
            except json.JSONDecodeError:
                pass

        # 返回默认装修巡查项
        return [
            "是否擅自变动建筑主体和承重结构",
            "是否将没有防水要求的房间改为卫生间/厨房间",
            "是否擅自改变住宅外立面/开设门窗",
            "是否损坏房屋原有节能设施/降低节能效果",
            "施工人员是否佩戴出入证/穿戴反光背心",
            "装修垃圾是否袋装并堆放在指定区域"
        ]

    @staticmethod
    async def update_renovation_items(db: AsyncSession, items: List[str]) -> None:
        """
        保存装修巡查项配置

        Args:
            db: 异步数据库会话
            items: 装修巡查项列表
        """
        result = await db.execute(select(SystemConfigModel))
        config = result.scalar_one_or_none()

        if not config:
            config = SystemConfigModel()
            db.add(config)

        config.renovation_items = json.dumps(items, ensure_ascii=False)
        await db.commit()
        logger.info("装修巡查项配置保存成功")

    @staticmethod
    async def get_ai_knowledge_base(db: AsyncSession, default_content: str = None) -> str:
        """
        获取AI知识库内容

        Args:
            db: 异步数据库会话
            default_content: 默认内容

        Returns:
            str: AI知识库内容
        """
        config = await ConfigService.get_config(db)
        ai_kb = config.ai_knowledge_base if config and config.ai_knowledge_base else default_content
        return ai_kb

    @staticmethod
    async def update_ai_knowledge_base(db: AsyncSession, content: str) -> None:
        """
        更新AI知识库内容

        Args:
            db: 异步数据库会话
            content: 知识库内容
        """
        await ConfigService.update_config(db, SystemConfigUpdate(ai_knowledge_base=content))
