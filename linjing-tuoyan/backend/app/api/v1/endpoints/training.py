from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.models.case import Script
from app.models.training import TrainingRecord, TrainingStatus, LearningProfile
from app.schemas.training import (
    TrainingStartRequest,
    TrainingDecisionRequest,
    TrainingRecordResponse,
    LearningProfileResponse,
    SkillAssessment,
    EmotionalPatterns,
    TrainingHistoryItem
)
from app.api.v1.endpoints.auth import get_current_active_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/training", tags=["实训管理"])


@router.post("/start", response_model=TrainingRecordResponse)
async def start_training(
    request: TrainingStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """开始新的实训"""
    script = db.query(Script).filter(Script.id == request.script_id).first()
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="剧本不存在"
        )

    record = TrainingRecord(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        script_id=request.script_id,
        start_time=datetime.utcnow(),
        decisions=[],
        total_dp_spent=0,
        dp_budget=script.total_dp_budget,
        score=0.0,
        status=TrainingStatus.IN_PROGRESS,
        current_scene_id=script.scenes[0]["id"] if script.scenes else None
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return TrainingRecordResponse.model_validate(record)


@router.post("/{record_id}/decision")
async def submit_decision(
    record_id: str,
    decision_data: TrainingDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """提交决策"""
    record = db.query(TrainingRecord).filter(
        TrainingRecord.id == record_id,
        TrainingRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="实训记录不存在"
        )

    script = db.query(Script).filter(Script.id == record.script_id).first()
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="剧本不存在"
        )

    decision_dict = decision_data.model_dump()
    decision_dict["timestamp"] = datetime.utcnow().isoformat()

    decisions = record.decisions or []
    decisions.append(decision_dict)

    total_dp = record.total_dp_spent + decision_data.dp_spent
    current_scene_idx = next(
        (i for i, scene in enumerate(script.scenes) if scene["id"] == decision_data.scene_id),
        0
    )
    next_scene_id = script.scenes[current_scene_idx + 1]["id"] if current_scene_idx < len(script.scenes) - 1 else None

    score = calculate_score(decisions, script.scenes)

    record.decisions = decisions
    record.total_dp_spent = total_dp
    record.current_scene_id = next_scene_id
    record.score = score

    db.commit()
    db.refresh(record)

    return {
        "success": True,
        "record": TrainingRecordResponse.model_validate(record),
        "tension_detected": decision_data.emotional_state.tension_level > 70
    }


@router.post("/{record_id}/complete", response_model=TrainingRecordResponse)
async def complete_training(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """完成实训"""
    record = db.query(TrainingRecord).filter(
        TrainingRecord.id == record_id,
        TrainingRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="实训记录不存在"
        )

    script = db.query(Script).filter(Script.id == record.script_id).first()
    if script:
        score = calculate_score(record.decisions, script.scenes)
        record.score = score

    record.status = TrainingStatus.COMPLETED
    record.end_time = datetime.utcnow()

    update_learning_profile(db, current_user.id, record)

    db.commit()
    db.refresh(record)

    return TrainingRecordResponse.model_validate(record)


@router.get("/{record_id}", response_model=TrainingRecordResponse)
async def get_training_record(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取实训记录"""
    record = db.query(TrainingRecord).filter(
        TrainingRecord.id == record_id,
        TrainingRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="实训记录不存在"
        )

    return TrainingRecordResponse.model_validate(record)


@router.get("/history/{user_id}", response_model=List[TrainingRecordResponse])
async def get_training_history(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取用户实训历史"""
    if current_user.role.value != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此用户的历史记录"
        )

    records = db.query(TrainingRecord).filter(
        TrainingRecord.user_id == user_id,
        TrainingRecord.status == TrainingStatus.COMPLETED
    ).order_by(TrainingRecord.end_time.desc()).limit(50).all()

    return [TrainingRecordResponse.model_validate(record) for record in records]


def calculate_score(decisions: list, scenes: list) -> float:
    """计算实训得分"""
    if not decisions or not scenes:
        return 0.0

    optimal_count = 0
    total_scenes = len(scenes)

    for decision in decisions:
        scene_id = decision.get("scene_id")
        option_id = decision.get("option_id")

        if scene_id and option_id:
            scene = next((s for s in scenes if s["id"] == scene_id), None)
            if scene and scene.get("options"):
                option = next((o for o in scene["options"] if o["id"] == option_id), None)
                if option and option.get("is_optimal"):
                    optimal_count += 1

    return round((optimal_count / total_scenes) * 100, 2) if total_scenes > 0 else 0.0


def update_learning_profile(db: Session, user_id: str, record: TrainingRecord):
    """更新学习画像"""
    profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()

    if not profile:
        profile = LearningProfile(
            id=str(uuid.uuid4()),
            user_id=user_id,
            overall_score=0.0,
            skills={},
            weaknesses=[],
            strengths=[],
            recommended_cases=[],
            training_history=[],
            emotional_patterns={}
        )
        db.add(profile)

    script = db.query(Script).filter(Script.id == record.script_id).first()
    training_history = profile.training_history or []
    training_history.append({
        "case_id": record.script_id,
        "score": record.score,
        "completed_at": datetime.utcnow().isoformat()
    })

    total_score = sum([h["score"] for h in training_history])
    avg_score = total_score / len(training_history) if training_history else 0

    skills = profile.skills or {}
    for scene in (script.scenes if script else []):
        scene_type = scene.get("type", "assessment")
        if scene_type in skills:
            skills[scene_type] = (skills[scene_type] + record.score) / 2
        else:
            skills[scene_type] = record.score

    weaknesses = []
    strengths = []
    for skill, score in skills.items():
        if score < 60:
            weaknesses.append(skill)
        elif score >= 80:
            strengths.append(skill)

    tension_levels = [
        d.get("emotional_state", {}).get("tension_level", 0)
        for d in record.decisions
        if d.get("emotional_state")
    ]
    avg_tension = sum(tension_levels) / len(tension_levels) if tension_levels else 0

    emotional_patterns = profile.emotional_patterns or {}
    emotional_patterns["average_tension"] = avg_tension
    emotional_patterns["improvement_rate"] = calculate_improvement_rate(training_history)

    profile.training_history = training_history
    profile.overall_score = avg_score
    profile.skills = skills
    profile.weaknesses = weaknesses
    profile.strengths = strengths
    profile.emotional_patterns = emotional_patterns

    db.commit()
    db.refresh(profile)


def calculate_improvement_rate(history: list) -> float:
    """计算进步率"""
    if len(history) < 2:
        return 0.0

    scores = [h["score"] for h in history]
    first_half = scores[:len(scores)//2]
    second_half = scores[len(scores)//2:]

    avg_first = sum(first_half) / len(first_half) if first_half else 0
    avg_second = sum(second_half) / len(second_half) if second_half else 0

    if avg_first == 0:
        return 0.0

    return round(((avg_second - avg_first) / avg_first) * 100, 2)
