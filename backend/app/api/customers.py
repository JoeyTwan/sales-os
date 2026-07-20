from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, text
from typing import List
from datetime import datetime

from ..database import get_db
from ..models.customer import Customer
from ..models.customer_ai_summary import CustomerAISummary
from ..models.contact import Contact
from ..models.project import Project
from ..models.activity import Activity
from ..schemas.customer import CustomerCreate, CustomerUpdate, CustomerOut
from ..schemas.overview import CustomerOverview
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


@router.get("/{customer_id}/overview", response_model=CustomerOverview)
def get_customer_overview(customer_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer_result = db.execute(
        text("SELECT id, name, level, status, summary FROM customers WHERE id = :customer_id"),
        {"customer_id": customer_id}
    ).first()
    
    if not customer_result:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer_dict = {
        "id": customer_result.id,
        "name": customer_result.name,
        "level": customer_result.level,
        "status": customer_result.status,
        "summary": customer_result.summary,
    }
    
    contacts_result = db.execute(
        text("SELECT id, name, position, phone, email, remark FROM contacts WHERE customer_id = :customer_id"),
        {"customer_id": customer_id}
    ).all()
    
    contacts_list = [{
        "id": c.id,
        "name": c.name,
        "position": c.position,
        "phone": c.phone,
        "email": c.email,
        "remark": c.remark,
    } for c in contacts_result]
    
    projects_result = db.execute(
        text("SELECT id, name, description, budget, status FROM projects WHERE customer_id = :customer_id"),
        {"customer_id": customer_id}
    ).all()
    
    projects_list = [{
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "budget": p.budget,
        "status": p.status,
    } for p in projects_result]
    
    activities_result = db.execute(
        text("SELECT id, content, source, activity_date FROM activities WHERE customer_id = :customer_id ORDER BY activity_date DESC"),
        {"customer_id": customer_id}
    ).all()
    
    activities_list = [{
        "id": a.id,
        "content": a.content,
        "source": a.source,
        "activity_date": a.activity_date,
    } for a in activities_result]
    
    statistics = {
        "project_count": len(projects_list),
        "contact_count": len(contacts_list),
        "activity_count": len(activities_list),
    }
    
    return {
        "customer": customer_dict,
        "contacts": contacts_list,
        "projects": projects_list,
        "activities": activities_list,
        "statistics": statistics,
    }
