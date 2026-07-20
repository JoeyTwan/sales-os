from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime

from ..database import get_db
from ..models.customer import Customer
from ..models.customer_ai_summary import CustomerAISummary
from ..models.contact import Contact
from ..models.project import Project
from ..schemas.customer import CustomerCreate, CustomerUpdate, CustomerOut
from ..utils.auth import get_current_user
from ..models.user import User
from ..utils.date_parser import parse_natural_date

router = APIRouter(prefix="/api/customers", tags=["customers"])


def _get_customer_with_summary(db: Session, customer: Customer) -> dict:
    customer_dict = customer.__dict__.copy()
    customer_dict.pop("_sa_instance_state", None)
    
    contacts = db.query(Contact).filter(Contact.customer_id == customer.id).all()
    customer_dict["contacts"] = [{
        "id": c.id,
        "name": c.name,
        "position": c.position,
        "customer_id": c.customer_id,
    } for c in contacts]
    
    projects = db.query(Project).filter(Project.customer_id == customer.id).all()
    customer_dict["projects"] = [{
        "id": p.id,
        "name": p.name,
        "status": p.status.value if hasattr(p.status, 'value') else p.status,
        "customer_id": p.customer_id,
    } for p in projects]
    
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
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer_data = customer.model_dump(exclude={"contact_name", "contact_position", "remark"})
    db_customer = Customer(**customer_data, user_id=current_user.id)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    if customer.contact_name:
        db_contact = Contact(
            customer_id=db_customer.id,
            name=customer.contact_name,
            position=customer.contact_position,
            user_id=current_user.id,
        )
        db.add(db_contact)
        db.commit()
        db.refresh(db_customer)
    
    return _get_customer_with_summary(db, db_customer)


@router.get("", response_model=List[CustomerOut])
def get_customers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customers = db.query(Customer).filter(Customer.user_id == current_user.id).order_by(desc(Customer.updated_at)).all()
    return [_get_customer_with_summary(db, c) for c in customers]


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return _get_customer_with_summary(db, customer)


@router.patch("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: str, customer_update: CustomerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = customer_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    return _get_customer_with_summary(db, customer)
