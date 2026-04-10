from typing import List, Optional
from datetime import datetime
from app.domains.usage_logs.models import UsageLogModel


# 模拟数据（当前使用内存存储，后续可迁移到数据库）
MOCK_LOGS = [
    UsageLogModel(
        id="1",
        user_id="2",
        username="boss",
        enterprise_name="东元示范物业",
        feature_id="docs",
        feature_name="文档查询",
        timestamp=1704067200000,
        created_at=datetime.fromtimestamp(1704067200000 / 1000)
    ),
    UsageLogModel(
        id="2",
        user_id="3",
        username="manager",
        enterprise_name="东元示范物业",
        feature_id="civil-code",
        feature_name="民法典查询",
        timestamp=1704153600000,
        created_at=datetime.fromtimestamp(1704153600000 / 1000)
    ),
    UsageLogModel(
        id="3",
        user_id="2",
        username="boss",
        enterprise_name="东元示范物业",
        feature_id="risks",
        feature_name="风险自查",
        timestamp=1704240000000,
        created_at=datetime.fromtimestamp(1704240000000 / 1000)
    ),
]


class UsageLogsService:
    """使用日志业务逻辑服务"""

    @staticmethod
    async def get_logs(
        enterprise: Optional[str] = None,
        feature: Optional[str] = None
    ) -> List[UsageLogModel]:
        """
        获取使用日志列表

        Args:
            enterprise: 可选，按企业名称过滤
            feature: 可选，按功能名称过滤

        Returns:
            List[UsageLogModel]: 使用日志列表
        """
        logs = MOCK_LOGS

        if enterprise:
            logs = [l for l in logs if l.enterprise_name == enterprise]
        if feature:
            logs = [l for l in logs if l.feature_id == feature]

        return logs
