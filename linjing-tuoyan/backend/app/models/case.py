from sqlalchemy import Column, String, Text, Enum as SQLEnum, DateTime, Table, ForeignKey, Float, Integer, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class CaseStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(SQLEnum(Difficulty), default=Difficulty.MEDIUM)
    tags = Column(JSON, default=list)
    status = Column(SQLEnum(CaseStatus), default=CaseStatus.DRAFT)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scripts = relationship("Script", back_populates="case")
    training_records = relationship("TrainingRecord", back_populates="case")


class Script(Base):
    __tablename__ = "scripts"

    id = Column(String(36), primary_key=True, index=True)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    patient_info = Column(JSON, nullable=False)
    scenes = Column(JSON, nullable=False)
    total_dp_budget = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    case = relationship("Case", back_populates="scripts")
    training_records = relationship("TrainingRecord", back_populates="script")
