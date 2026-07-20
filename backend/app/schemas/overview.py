from uuid import UUID
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel


class CustomerOverviewContact(BaseModel):
    id: str
    name: str
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    remark: Optional[str] = None


class CustomerOverviewProject(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    amount: Optional[int] = None
    status: str
    updated_at: Optional[datetime] = None


class CustomerOverviewActivity(BaseModel):
    id: str
    content: str
    source: str
    activity_date: date


class CustomerOverviewTask(BaseModel):
    id: str
    title: str
    status: str
    priority: str
    due_date: Optional[date] = None


class CustomerOverviewStatistics(BaseModel):
    project_count: int
    contact_count: int
    task_count: int
    activity_count: int
    project_stage_count: dict


class CustomerOverview(BaseModel):
    customer: dict
    contacts: List[CustomerOverviewContact]
    projects: List[CustomerOverviewProject]
    tasks: List[CustomerOverviewTask]
    activities: List[CustomerOverviewActivity]
    statistics: CustomerOverviewStatistics


class ProjectOverviewContact(BaseModel):
    id: str
    name: str
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    remark: Optional[str] = None


class ProjectOverviewTask(BaseModel):
    id: str
    title: str
    status: str
    priority: str
    due_date: Optional[date] = None


class ProjectOverviewActivity(BaseModel):
    id: str
    content: str
    source: str
    activity_date: date


class ProjectOverviewStatistics(BaseModel):
    contact_count: int
    task_count: int
    activity_count: int


class ProjectOverviewCustomer(BaseModel):
    id: str
    name: str
    level: str
    status: str


class ProjectOverview(BaseModel):
    project: dict
    customer: ProjectOverviewCustomer
    contacts: List[ProjectOverviewContact]
    tasks: List[ProjectOverviewTask]
    activities: List[ProjectOverviewActivity]
    statistics: ProjectOverviewStatistics