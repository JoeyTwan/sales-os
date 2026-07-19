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
    level: CustomerLevel
    status: CustomerStatus
    summary: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[date] = None
    last_activity_date: Optional[date] = None


class CustomerCreate(CustomerBase):
    contact_name: Optional[str] = None
    contact_position: Optional[str] = None
    remark: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    level: Optional[CustomerLevel] = None
    status: Optional[CustomerStatus] = None
    summary: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[date] = None
    last_activity_date: Optional[date] = None


class ContactSchema(BaseModel):
    id: UUID
    name: str
    position: Optional[str] = None
    customer_id: UUID

    class Config:
        from_attributes = True


class ProjectSchema(BaseModel):
    id: UUID
    name: str
    status: str
    customer_id: UUID

    class Config:
        from_attributes = True


class CustomerOut(CustomerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    contacts: Optional[List[ContactSchema]] = None
    projects: Optional[List[ProjectSchema]] = None
    ai_summary: Optional[CustomerAISummarySchema] = None

    class Config:
        from_attributes = True
