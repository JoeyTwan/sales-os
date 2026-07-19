from enum import Enum
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class CustomerLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class CustomerStatus(str, Enum):
    ACTIVE = "ACTIVE"
    FOLLOWING = "FOLLOWING"
    PAUSED = "PAUSED"
    LOST = "LOST"


class CustomerAISummarySchema(BaseModel):
    stage: Optional[str] = None
    budget: Optional[str] = None
    decision_maker: Optional[str] = None
    risk: Optional[str] = None
    next_action: Optional[str] = None
    estimated_close_date: Optional[date] = None
    confidence: Optional[int] = None
    last_activity_summary: Optional[str] = None


class CustomerBase(BaseModel):
    name: str = Field(..., max_length=255)
    company: Optional[str] = None
    contact: Optional[str] = None
    level: CustomerLevel
    status: CustomerStatus
    summary: Optional[str] = None
    current_requirement: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[date] = None
    estimated_close_date: Optional[date] = None
    remark: Optional[str] = None
    last_activity_date: Optional[date] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    company: Optional[str] = None
    contact: Optional[str] = None
    level: Optional[CustomerLevel] = None
    status: Optional[CustomerStatus] = None
    summary: Optional[str] = None
    current_requirement: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[date] = None
    estimated_close_date: Optional[date] = None
    remark: Optional[str] = None
    last_activity_date: Optional[date] = None


class CustomerOut(CustomerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    ai_summary: Optional[CustomerAISummarySchema] = None

    class Config:
        from_attributes = True
