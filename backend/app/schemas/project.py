from enum import Enum
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProjectStatus(str, Enum):
    LEAD = "LEAD"
    QUALIFIED = "QUALIFIED"
    PROPOSAL = "PROPOSAL"
    NEGOTIATION = "NEGOTIATION"
    WON = "WON"
    LOST = "LOST"


class ProjectBase(BaseModel):
    customer_id: UUID
    name: str = Field(..., description="项目名称")
    description: Optional[str] = Field(None, description="项目描述")
    budget: Optional[int] = Field(None, description="预算（元）")
    status: ProjectStatus = Field(ProjectStatus.LEAD, description="项目状态")


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, description="项目名称")
    description: Optional[str] = Field(None, description="项目描述")
    budget: Optional[int] = Field(None, description="预算（元）")
    status: Optional[ProjectStatus] = Field(None, description="项目状态")


class ProjectOut(ProjectBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True