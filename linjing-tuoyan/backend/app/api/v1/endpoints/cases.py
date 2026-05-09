from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.models.case import Case, CaseStatus
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse, ScriptResponse
from app.api.v1.endpoints.auth import get_current_active_user
import uuid

router = APIRouter(prefix="/cases", tags=["病例管理"])


@router.get("/", response_model=List[CaseResponse])
async def get_cases(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """获取所有病例"""
    cases = db.query(Case).offset(skip).limit(limit).all()
    return [CaseResponse.model_validate(case) for case in cases]


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取指定病例"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="病例不存在"
        )
    return CaseResponse.model_validate(case)


@router.post("/", response_model=CaseResponse)
async def create_case(
    case_data: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建新病例"""
    case = Case(
        id=str(uuid.uuid4()),
        title=case_data.title,
        description=case_data.description,
        difficulty=case_data.difficulty,
        tags=case_data.tags,
        status=CaseStatus.DRAFT
    )

    db.add(case)
    db.commit()
    db.refresh(case)

    return CaseResponse.model_validate(case)


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    case_data: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新病例"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="病例不存在"
        )

    update_data = case_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)

    db.commit()
    db.refresh(case)

    return CaseResponse.model_validate(case)


@router.delete("/{case_id}")
async def delete_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除病例"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="病例不存在"
        )

    db.delete(case)
    db.commit()

    return {"message": "病例已删除"}


@router.post("/{case_id}/generate-script", response_model=ScriptResponse)
async def generate_script(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """为病例生成剧本"""
    from app.models.case import Script
    import uuid as uuid_lib

    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="病例不存在"
        )

    existing_script = db.query(Script).filter(Script.case_id == case_id).first()
    if existing_script:
        return ScriptResponse.model_validate(existing_script)

    patient_info = {
        "name": "模拟患者",
        "age": 55,
        "gender": "male",
        "chief_complaint": case.description[:100],
        "medical_history": ["高血压病史5年", "糖尿病史3年"],
        "vital_signs": {
            "temperature": 37.2,
            "pulse": 88,
            "respiration": 20,
            "blood_pressure": {"systolic": 145, "diastolic": 95},
            "spo2": 96
        }
    }

    scenes = [
        {
            "id": str(uuid_lib.uuid4()),
            "type": "assessment",
            "title": "健康史采集",
            "description": "请采集患者的主诉和现病史，了解本次就诊的主要原因",
            "dp_cost": 10,
            "options": [
                {
                    "id": str(uuid_lib.uuid4()),
                    "content": "详细询问患者不适症状及持续时间",
                    "dp_cost": 10,
                    "is_optimal": True,
                    "consequence": "获得了完整的病史信息"
                },
                {
                    "id": str(uuid_lib.uuid4()),
                    "content": "简单询问后直接进行体检",
                    "dp_cost": 5,
                    "is_optimal": False,
                    "consequence": "可能遗漏重要病史信息"
                }
            ],
            "required_skills": ["assessment", "communication"],
            "difficulty_modifier": 1.0
        },
        {
            "id": str(uuid_lib.uuid4()),
            "type": "diagnosis",
            "title": "护理诊断",
            "description": "基于采集到的信息，制定护理诊断",
            "dp_cost": 15,
            "options": [
                {
                    "id": str(uuid_lib.uuid4()),
                    "content": "提出完整的护理诊断计划",
                    "dp_cost": 15,
                    "is_optimal": True,
                    "consequence": "诊断全面准确"
                },
                {
                    "id": str(uuid_lib.uuid4()),
                    "content": "仅关注患者主诉症状",
                    "dp_cost": 8,
                    "is_optimal": False,
                    "consequence": "护理诊断不全面"
                }
            ],
            "required_skills": ["diagnosis"],
            "difficulty_modifier": 1.2
        },
        {
            "id": str(uuid_lib.uuid4()),
            "type": "intervention",
            "title": "护理干预",
            "description": "选择最重要的护理措施执行",
            "dp_cost": 20,
            "options": [
                {
                    "id": str(uuid_lib.uuid4()),
                    "content": "执行系统性护理干预措施",
                    "dp_cost": 20,
                    "is_optimal": True,
                    "consequence": "干预措施得当，患者状态改善"
                },
                {
                    "id": str(uuid_lib.uuid4()),
                    "content": "仅执行基本护理操作",
                    "dp_cost": 10,
                    "is_optimal": False,
                    "consequence": "护理效果有限"
                }
            ],
            "required_skills": ["intervention", "emergency_response"],
            "difficulty_modifier": 1.5
        }
    ]

    script = Script(
        id=str(uuid_lib.uuid4()),
        case_id=case_id,
        patient_info=patient_info,
        scenes=scenes,
        total_dp_budget=100
    )

    db.add(script)
    db.commit()
    db.refresh(script)

    return ScriptResponse.model_validate(script)
