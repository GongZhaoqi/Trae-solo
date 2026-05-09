from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.case import Script
from app.schemas.case import ScriptResponse
from app.api.v1.endpoints.auth import get_current_active_user

router = APIRouter(prefix="/scripts", tags=["剧本管理"])


@router.get("/{script_id}", response_model=ScriptResponse)
async def get_script(
    script_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取剧本详情"""
    script = db.query(Script).filter(Script.id == script_id).first()

    if not script:
        raise HTTPException(
            status_code=404,
            detail="剧本不存在"
        )

    return ScriptResponse.model_validate(script)


@router.get("/case/{case_id}", response_model=ScriptResponse)
async def get_script_by_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """根据病例ID获取剧本"""
    script = db.query(Script).filter(Script.case_id == case_id).first()

    if not script:
        raise HTTPException(
            status_code=404,
            detail="该病例尚未生成剧本"
        )

    return ScriptResponse.model_validate(script)
