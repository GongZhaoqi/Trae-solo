from sqlalchemy import Column, String, DateTime, Integer, Float, Enum as SQLEnum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class TrainingStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class TrainingRecord(Base):
    __tablename__ = "training_records"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    script_id = Column(String(36), ForeignKey("scripts.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    current_scene_id = Column(String(36), nullable=True)
    decisions = Column(JSON, default=list)
    total_dp_spent = Column(Integer, default=0)
    dp_budget = Column(Integer, default=100)
    score = Column(Float, default=0.0)
    status = Column(SQLEnum(TrainingStatus), default=TrainingStatus.IN_PROGRESS)

    user = relationship("User", back_populates="training_records")
    script = relationship("Script", back_populates="training_records")


class LearningProfile(Base):
    __tablename__ = "learning_profiles"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    overall_score = Column(Float, default=0.0)
    skills = Column(JSON, default=dict)
    weaknesses = Column(JSON, default=list)
    strengths = Column(JSON, default=list)
    recommended_cases = Column(JSON, default=list)
    training_history = Column(JSON, default=list)
    emotional_patterns = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="learning_profile")
