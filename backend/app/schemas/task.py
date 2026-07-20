from enum import Enum
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    TODO = "TODO"
    DOING = "DOING"
    DONE = "DONE"


class TaskPriority(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TaskBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[date] = None
    project_id: str
    customer_id: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[date] = None
    project_id: Optional[str] = None
    customer_id: Optional[str] = None


class TaskOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[date] = None
    project_id: Optional[str] = None
    customer_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None
    project_name: Optional[str] = None

    class Config:
        from_attributes = True