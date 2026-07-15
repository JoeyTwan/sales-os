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


class CustomerBase(BaseModel):
    name: str = Field(..., max_length=255)
    level: CustomerLevel
    status: CustomerStatus
    summary: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[date] = None
    last_activity_date: Optional[date] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    level: Optional[CustomerLevel] = None
    status: Optional[CustomerStatus] = None
    summary: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[date] = None
    last_activity_date: Optional[date] = None


class CustomerOut(CustomerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
