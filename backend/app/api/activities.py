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


class ActivitySummary(BaseModel):
    id: str
    content: str
    activity_date: date
    created_at: datetime


@router.post("/raw")
def create_raw_activity(request: RawActivityRequest, db: Session = Depends(get_db)):
    activity = Activity(
        customer_id="00000000-0000-0000-0000-000000000000",
        type="NOTE",
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
        type="NOTE",
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
