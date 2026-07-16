from enum import Enum
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class ActivitySource(str, Enum):
    CAPTURE = "capture"
    MANUAL = "manual"
    EMAIL = "email"
    MEETING = "meeting"


class ActivityBase(BaseModel):
    customer_id: Optional[UUID] = Field(None, description="客户ID")
    project_id: Optional[UUID] = Field(None, description="项目ID")
    content: str = Field(..., description="活动内容")
    source: ActivitySource = Field(ActivitySource.MANUAL, description="来源")
    activity_date: date = Field(..., description="活动日期")


class ActivityCreate(ActivityBase):
    pass


class ActivityOut(ActivityBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True