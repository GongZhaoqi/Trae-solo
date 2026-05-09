from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class EmotionalState(BaseModel):
    tension_level: float = 0.0
    confidence_level: float = 50.0
    calmness_level: float = 100.0


class Decision(BaseModel):
    scene_id: str
    option_id: Optional[str] = None
    voice_input: Optional[str] = None
    emotional_state: EmotionalState
    timestamp: str
    dp_spent: int


class TrainingStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class TrainingStartRequest(BaseModel):
    script_id: str


class TrainingDecisionRequest(BaseModel):
    scene_id: str
    option_id: Optional[str] = None
    voice_input: Optional[str] = None
    emotional_state: EmotionalState
    dp_spent: int


class TrainingRecordResponse(BaseModel):
    id: str
    user_id: str
    script_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    current_scene_id: Optional[str] = None
    decisions: List[Dict[str, Any]] = []
    total_dp_spent: int
    dp_budget: int
    score: float
    status: TrainingStatus

    class Config:
        from_attributes = True


class SkillAssessment(BaseModel):
    assessment: float = 0.0
    diagnosis: float = 0.0
    intervention: float = 0.0
    communication: float = 0.0
    emergency_response: float = 0.0
    documentation: float = 0.0


class EmotionalPatterns(BaseModel):
    average_tension: float = 0.0
    improvement_rate: float = 0.0


class TrainingHistoryItem(BaseModel):
    case_id: str
    score: float
    completed_at: str


class LearningProfileResponse(BaseModel):
    id: str
    user_id: str
    overall_score: float
    skills: SkillAssessment
    weaknesses: List[str]
    strengths: List[str]
    recommended_cases: List[str]
    training_history: List[TrainingHistoryItem]
    emotional_patterns: EmotionalPatterns

    class Config:
        from_attributes = True


class MultimodalSessionRequest(BaseModel):
    session_type: str = "training"


class EmotionAnalysisRequest(BaseModel):
    image_data: Optional[str] = None
    video_frame: Optional[str] = None


class EmotionAnalysisResponse(BaseModel):
    tension_level: float
    confidence_level: float
    calmness_level: float


class GestureAnalysisRequest(BaseModel):
    hand_landmarks: List[Dict[str, Any]]


class GestureAnalysisResponse(BaseModel):
    accuracy_score: float
    feedback: Optional[str] = None
