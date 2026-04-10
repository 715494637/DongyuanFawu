from typing import Optional, List
from fastapi import APIRouter, Query
from app.domains.usage_logs.schemas import UsageLogResponse
from app.domains.usage_logs.service import UsageLogsService

router = APIRouter()


@router.get("", response_model=List[UsageLogResponse])
async def get_usage_logs(
    enterprise: Optional[str] = Query(None, description="按企业名称过滤"),
    feature: Optional[str] = Query(None, description="按功能名称过滤")
) -> List[dict]:
    """
    获取使用日志列表（仅管理员）

    Args:
        enterprise: 可选，按企业名称过滤
        feature: 可选，按功能名称过滤

    Returns:
        List[UsageLogResponse]: 使用日志列表
    """
    logs = await UsageLogsService.get_logs(enterprise, feature)

    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "username": log.username,
            "enterprise_name": log.enterprise_name,
            "feature_id": log.feature_id,
            "feature_name": log.feature_name,
            "timestamp": log.timestamp,
            "timestamp_str": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else None
        }
        for log in logs
    ]
