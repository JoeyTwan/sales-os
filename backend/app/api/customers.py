from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from ..database import get_db
from ..models.customer import Customer
from ..models.customer_ai_summary import CustomerAISummary
from ..schemas.customer import CustomerCreate, CustomerUpdate, CustomerOut

router = APIRouter(prefix="/api/customers", tags=["customers"])


def _get_customer_with_summary(db: Session, customer: Customer) -> dict:
    customer_dict = customer.__dict__.copy()
    customer_dict.pop("_sa_instance_state", None)
    
    summary = db.query(CustomerAISummary).filter(CustomerAISummary.customer_id == customer.id).first()
    if summary:
        customer_dict["ai_summary"] = {
            "stage": summary.stage,
            "budget": summary.budget,
            "decision_maker": summary.decision_maker,
            "risk": summary.risk,
            "next_action": summary.next_action,
            "estimated_close_date": summary.estimated_close_date,
            "confidence": summary.confidence,
            "last_activity_summary": summary.last_activity_summary,
        }
    else:
        customer_dict["ai_summary"] = None
    
    return customer_dict


@router.post("", response_model=CustomerOut)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return _get_customer_with_summary(db, db_customer)


@router.get("", response_model=List[CustomerOut])
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).order_by(desc(Customer.updated_at)).all()
    return [_get_customer_with_summary(db, c) for c in customers]


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return _get_customer_with_summary(db, customer)


@router.patch("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: str, customer_update: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    return _get_customer_with_summary(db, customer)
