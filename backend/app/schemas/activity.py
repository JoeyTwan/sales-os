from enum import Enum
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel, Field


class ActivityType(str, Enum):
    VISIT = "VISIT"
    CALL = "CALL"
    WECHAT = "WECHAT"
    MEETING = "MEETING"
    EMAIL = "EMAIL"
    NOTE = "NOTE"


class ActivityBase(BaseModel):
    customer_id: UUID
    type: ActivityType
    content: str
    activity_date: date


class ActivityCreate(ActivityBase):
    pass


class ActivityOut(ActivityBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
