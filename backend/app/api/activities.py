from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date, datetime
from pydantic import BaseModel
from typing import List, Optional

from ..database import get_db
from ..models.activity import Activity

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
def create_raw_activity(request: RawActivityRequest, db: Session = Depends(get_db)):
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
def create_activity_for_customer(request: ActivityForCustomerRequest, db: Session = Depends(get_db)):
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
def create_activity(request: ActivityCreateRequest, db: Session = Depends(get_db)):
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
def get_recent_activities(db: Session = Depends(get_db)):
    activities = (
        db.query(Activity)
        .order_by(desc(Activity.activity_date), desc(Activity.created_at))
        .limit(20)
        .all()
    )
    return activities


@router.get("/customer/{customer_id}", response_model=List[ActivitySummary])
def get_customer_activities(customer_id: str, db: Session = Depends(get_db)):
    activities = (
        db.query(Activity)
        .filter(Activity.customer_id == customer_id)
        .order_by(desc(Activity.activity_date), desc(Activity.created_at))
        .all()
    )
    return activities