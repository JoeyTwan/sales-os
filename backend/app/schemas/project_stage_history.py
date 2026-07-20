from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProjectStageHistoryCreate(BaseModel):
    from_status: Optional[str] = None
    to_status: str
    remark: Optional[str] = None


class ProjectStageHistoryOut(BaseModel):
    id: str
    project_id: str
    from_status: Optional[str]
    to_status: str
    remark: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectStatusUpdate(BaseModel):
    status: str
    remark: Optional[str] = None


class ProjectStatusUpdateOut(BaseModel):
    id: str
    name: str
    old_status: str
    new_status: str
    updated_at: datetime


class ProjectNextActionUpdate(BaseModel):
    next_action: Optional[str] = None
    next_action_date: Optional[str] = None