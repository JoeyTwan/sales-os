from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProjectContactBase(BaseModel):
    project_id: UUID
    contact_id: UUID
    role: Optional[str] = Field(None, description="项目角色")
    remark: Optional[str] = Field(None, description="备注")


class ProjectContactCreate(BaseModel):
    contact_id: str
    role: Optional[str] = Field(None, description="项目角色")
    remark: Optional[str] = Field(None, description="备注")


class ProjectContactUpdate(BaseModel):
    role: Optional[str] = Field(None, description="项目角色")
    remark: Optional[str] = Field(None, description="备注")


class ProjectContactOut(BaseModel):
    id: str
    contact_id: str
    name: str
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    remark: Optional[str] = None

    class Config:
        from_attributes = True