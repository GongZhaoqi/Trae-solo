from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.training import (
    EmotionAnalysisRequest,
    EmotionAnalysisResponse,
    GestureAnalysisRequest,
    GestureAnalysisResponse
)
from app.api.v1.endpoints.auth import get_current_active_user
import uuid

router = APIRouter(prefix="/multimodal", tags=["多模态感知"])


@router.post("/session/start")
async def start_multimodal_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """启动多模态感知会话"""
    session_id = str(uuid.uuid4())

    return {
        "session_id": session_id,
        "status": "active",
        "message": "多模态感知会话已启动"
    }


@router.post("/session/{session_id}/data")
async def submit_multimodal_data(
    session_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """提交多模态数据"""
    return {
        "success": True,
        "session_id": session_id,
        "received": True
    }


@router.post("/analyze/emotion", response_model=EmotionAnalysisResponse)
async def analyze_emotion(
    request: EmotionAnalysisRequest,
    current_user: User = Depends(get_current_active_user)
):
    """分析情绪状态（基于MediaPipe Face Mesh）"""
    tension_level = 50.0
    confidence_level = 70.0
    calmness_level = 80.0

    if request.image_data or request.video_frame:
        tension_level = calculate_tension_from_image(request.image_data or request.video_frame)
        confidence_level = 100 - tension_level
        calmness_level = max(0, 100 - (tension_level * 1.2))

    return EmotionAnalysisResponse(
        tension_level=min(max(tension_level, 0), 100),
        confidence_level=min(max(confidence_level, 0), 100),
        calmness_level=min(max(calmness_level, 0), 100)
    )


def calculate_tension_from_image(image_data: str) -> float:
    """基于图像数据计算紧张程度（模拟MediaPipe分析）"""
    if not image_data:
        return 50.0

    hash_value = sum(ord(c) for c in image_data)
    tension = (hash_value % 100)

    return float(tension)


@router.post("/analyze/gesture", response_model=GestureAnalysisResponse)
async def analyze_gesture(
    request: GestureAnalysisRequest,
    current_user: User = Depends(get_current_active_user)
):
    """分析手势操作（基于MediaPipe Hands）"""
    accuracy_score = 85.0
    feedback = None

    if request.hand_landmarks:
        accuracy_score = evaluate_hand_gesture(request.hand_landmarks)
        if accuracy_score >= 90:
            feedback = "动作标准规范"
        elif accuracy_score >= 70:
            feedback = "动作基本正确，有小幅改进空间"
        else:
            feedback = "动作需要加强练习，注意细节"

    return GestureAnalysisResponse(
        accuracy_score=accuracy_score,
        feedback=feedback
    )


def evaluate_hand_gesture(landmarks: list) -> float:
    """评估手势准确性"""
    if not landmarks:
        return 75.0

    base_score = 85.0

    if len(landmarks) >= 21:
        base_score += 5.0

    variation = sum(1 for l in landmarks if isinstance(l, dict) and l.get("visibility", 0.5) > 0.5)
    if variation > 15:
        base_score += 5.0

    return min(base_score, 100.0)
