from uuid import UUID
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class CustomerAISummaryBase(BaseModel):
    stage: Optional[str] = None
    budget: Optional[str] = None
    decision_maker: Optional[str] = None
    risk: Optional[str] = None
    next_action: Optional[str] = None
    estimated_close_date: Optional[date] = None
    confidence: Optional[int] = None
    last_activity_summary: Optional[str] = None


class CustomerAISummaryOut(CustomerAISummaryBase):
    id: UUID
    customer_id: UUID
    last_generated_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerAISummaryRefreshResponse(BaseModel):
    success: bool
    summary: Optional[CustomerAISummaryOut] = None