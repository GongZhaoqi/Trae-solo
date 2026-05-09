from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.models.training import LearningProfile
from app.schemas.training import LearningProfileResponse, SkillAssessment, EmotionalPatterns
from app.api.v1.endpoints.auth import get_current_active_user

router = APIRouter(prefix="/learning", tags=["学习画像"])


@router.get("/profile/{user_id}", response_model=LearningProfileResponse)
async def get_learning_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取学习画像"""
    if current_user.role.value != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="无权限访问此用户的学习画像"
        )

    profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()

    if not profile:
        return LearningProfileResponse(
            id="",
            user_id=user_id,
            overall_score=0.0,
            skills=SkillAssessment(),
            weaknesses=[],
            strengths=[],
            recommended_cases=[],
            training_history=[],
            emotional_patterns=EmotionalPatterns()
        )

    return LearningProfileResponse.model_validate(profile)


@router.get("/recommendations/{user_id}")
async def get_recommendations(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取推荐病例"""
    if current_user.role.value != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="无权限访问此用户的推荐"
        )

    profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()

    if not profile:
        return {"recommended_cases": []}

    recommended_cases = profile.recommended_cases or []

    if not recommended_cases:
        weaknesses = profile.weaknesses or []
        recommended_cases = generate_recommendations_based_on_weaknesses(weaknesses)

    return {"recommended_cases": recommended_cases}


def generate_recommendations_based_on_weaknesses(weaknesses: List[str]) -> List[str]:
    """基于薄弱环节生成推荐"""
    recommendations = []

    weakness_mapping = {
        "assessment": "护理评估专项训练",
        "diagnosis": "临床诊断强化",
        "intervention": "护理干预练习",
        "communication": "沟通技巧训练",
        "emergency_response": "应急响应演练",
        "documentation": "护理文书规范"
    }

    for weakness in weaknesses:
        if weakness in weakness_mapping:
            recommendations.append(weakness_mapping[weakness])

    if not recommendations:
        recommendations = ["综合能力提升训练", "基础护理技能强化"]

    return recommendations
