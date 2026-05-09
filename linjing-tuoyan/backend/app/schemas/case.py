from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class CaseStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class VitalSigns(BaseModel):
    temperature: float
    pulse: int
    respiration: int
    blood_pressure: Dict[str, int]
    spo2: float


class PatientInfo(BaseModel):
    name: str
    age: int
    gender: str
    chief_complaint: str
    medical_history: List[str]
    vital_signs: VitalSigns


class SceneOption(BaseModel):
    id: str
    content: str
    dp_cost: int
    is_optimal: bool
    consequence: Optional[str] = None


class ScriptScene(BaseModel):
    id: str
    type: str
    title: str
    description: str
    dp_cost: int
    options: Optional[List[SceneOption]] = None
    required_skills: List[str]
    difficulty_modifier: float = 1.0


class CaseBase(BaseModel):
    title: str
    description: str
    difficulty: Difficulty = Difficulty.MEDIUM
    tags: List[str] = []


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    tags: Optional[List[str]] = None
    status: Optional[CaseStatus] = None


class CaseResponse(CaseBase):
    id: str
    status: CaseStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScriptResponse(BaseModel):
    id: str
    case_id: str
    patient_info: PatientInfo
    scenes: List[ScriptScene]
    total_dp_budget: int
    created_at: datetime

    class Config:
        from_attributes = True
