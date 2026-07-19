from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date, datetime
from pydantic import BaseModel
from typing import List, Optional, Any

from ..database import get_db
from ..models.activity import Activity
from ..models.task import Task
from ..models.project import Project
from ..utils.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/activities", tags=["activities"])


class RawActivityRequest(BaseModel):
    content: str


class ActivityForCustomerRequest(BaseModel):
    customer_id: str
    content: str


class ActivityCreateRequest(BaseModel):
    customer_id: Optional[str] = None
    project_id: Optional[str] = None
    content: str
    source: str = "manual"


class ActivitySummary(BaseModel):
    id: str
    customer_id: Optional[str] = None
    project_id: Optional[str] = None
    content: str
    source: str
    activity_date: date
    created_at: datetime


@router.post("/raw")
def create_raw_activity(request: RawActivityRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    activity = Activity(
        customer_id=None,
        project_id=None,
        source="manual",
        content=request.content,
        activity_date=date.today()
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return {"id": activity.id, "content": activity.content}


@router.post("/customer")
def create_activity_for_customer(request: ActivityForCustomerRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    activity = Activity(
        customer_id=request.customer_id,
        project_id=None,
        source="manual",
        content=request.content,
        activity_date=date.today()
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return {"id": activity.id, "content": activity.content}


@router.post("")
def create_activity(request: ActivityCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    activity = Activity(
        customer_id=request.customer_id,
        project_id=request.project_id,
        source=request.source,
        content=request.content,
        activity_date=date.today()
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return {"id": activity.id, "content": activity.content}


@router.get("", response_model=List[ActivitySummary])
def get_recent_activities(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    activities = (
        db.query(Activity)
        .order_by(desc(Activity.activity_date), desc(Activity.created_at))
        .limit(20)
        .all()
    )
    return activities


@router.get("/customer/{customer_id}", response_model=List[ActivitySummary])
def get_customer_activities(customer_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    activities = (
        db.query(Activity)
        .filter(Activity.customer_id == customer_id)
        .order_by(desc(Activity.activity_date), desc(Activity.created_at))
        .all()
    )
    return activities


class TimelineItem(BaseModel):
    id: str
    type: str
    title: str
    content: str
    timestamp: datetime
    status: Optional[str] = None
    priority: Optional[str] = None


@router.get("/customer/{customer_id}/timeline")
def get_customer_timeline(customer_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    timeline = []
    
    activities = (
        db.query(Activity)
        .filter(Activity.customer_id == customer_id)
        .order_by(desc(Activity.created_at))
        .all()
    )
    for activity in activities:
        timeline.append({
            "id": activity.id,
            "type": "activity",
            "title": "活动记录",
            "content": activity.content,
            "timestamp": activity.created_at,
            "status": activity.source,
        })
    
    tasks = (
        db.query(Task)
        .filter(Task.customer_id == customer_id)
        .order_by(desc(Task.created_at))
        .all()
    )
    for task in tasks:
        timeline.append({
            "id": task.id,
            "type": "task",
            "title": "创建任务",
            "content": task.title,
            "timestamp": task.created_at,
            "status": task.status,
            "priority": task.priority,
        })
    
    projects = (
        db.query(Project)
        .filter(Project.customer_id == customer_id)
        .order_by(desc(Project.created_at))
        .all()
    )
    for project in projects:
        status = project.status.value if hasattr(project.status, 'value') else project.status
        timeline.append({
            "id": project.id,
            "type": "project",
            "title": "项目状态变更",
            "content": project.name,
            "timestamp": project.updated_at,
            "status": status,
        })
    
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return timeline[:50]