from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProjectContactBase(BaseModel):
    project_id: UUID
    contact_id: UUID
    role: Optional[str] = Field(None, description="项目角色")
    remark: Optional[str] = Field(None, description="备注")


class ProjectContactCreate(ProjectContactBase):
    pass


class ProjectContactUpdate(BaseModel):
    role: Optional[str] = Field(None, description="项目角色")
    remark: Optional[str] = Field(None, description="备注")


class ProjectContactOut(ProjectContactBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True