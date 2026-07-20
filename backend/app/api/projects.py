from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, text
from typing import List

from ..database import get_db
from ..models.project import Project
from ..models.customer import Customer
from ..models.project_contact import ProjectContact
from ..models.contact import Contact
from ..models.task import Task
from ..models.activity import Activity
from ..models.project_stage_history import ProjectStageHistory
from ..schemas.project import ProjectCreate, ProjectOut, ProjectStatus
from ..schemas.overview import ProjectOverview
from ..schemas.project_contact import ProjectContactCreate, ProjectContactOut
from ..schemas.project_stage_history import ProjectStatusUpdate, ProjectStatusUpdateOut, ProjectNextActionUpdate, ProjectStageHistoryOut
from ..utils.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectOut)
def create_project(request: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = Project(
        customer_id=str(request.customer_id),
        name=request.name,
        description=request.description,
        amount=request.amount,
        status=request.status.value,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=List[ProjectOut])
def get_projects(status: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    projects = query.order_by(desc(Project.created_at)).all()
    return projects


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/customer/{customer_id}", response_model=List[ProjectOut])
def get_customer_projects(customer_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = (
        db.query(Project)
        .filter(Project.customer_id == customer_id)
        .order_by(desc(Project.created_at))
        .all()
    )
    return projects


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(project_id: str, request: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.name = request.name
    project.description = request.description
    project.amount = request.amount
    project.status = request.status.value
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}


@router.get("/{project_id}/overview", response_model=ProjectOverview)
def get_project_overview(project_id: str, db: Session = Depends(get_db)):
    project_result = db.execute(
        text("SELECT id, name, description, customer_id, status, budget, next_action, next_action_date, created_at, updated_at FROM projects WHERE id = :project_id"),
        {"project_id": project_id}
    ).first()
    
    if not project_result:
        raise HTTPException(status_code=404, detail="Project not found")
    
    customer_result = db.execute(
        text("SELECT id, name, level, status FROM customers WHERE id = :customer_id"),
        {"customer_id": project_result.customer_id}
    ).first()
    
    customer_name = customer_result.name if customer_result else None
    amount = project_result.budget
    
    project_dict = {
        "id": project_result.id,
        "name": project_result.name,
        "description": project_result.description,
        "customer_id": project_result.customer_id,
        "customer_name": customer_name,
        "status": project_result.status,
        "amount": amount,
        "next_action": project_result.next_action,
        "next_action_date": project_result.next_action_date,
        "created_at": project_result.created_at,
        "updated_at": project_result.updated_at,
    }
    
    customer_dict = {
        "id": customer_result.id,
        "name": customer_result.name,
        "level": customer_result.level,
        "status": customer_result.status,
    } if customer_result else None
    
    project_contacts_result = db.execute(
        text("SELECT contact_id, role, remark FROM project_contacts WHERE project_id = :project_id"),
        {"project_id": project_id}
    ).all()
    
    contact_ids = [pc.contact_id for pc in project_contacts_result]
    contacts_list = []
    
    if contact_ids:
        contacts_result = db.execute(
            text("SELECT id, name, position, phone, email FROM contacts WHERE id IN :contact_ids"),
            {"contact_ids": tuple(contact_ids)}
        ).all()
        
        contacts_dict = {c.id: c for c in contacts_result}
        for pc in project_contacts_result:
            c = contacts_dict.get(pc.contact_id)
            if c:
                contacts_list.append({
                    "id": c.id,
                    "name": c.name,
                    "position": c.position,
                    "phone": c.phone,
                    "email": c.email,
                    "role": pc.role,
                    "remark": pc.remark,
                })
    
    if not contacts_list:
        contacts_result = db.execute(
            text("SELECT id, name, position, phone, email FROM contacts WHERE customer_id = :customer_id"),
            {"customer_id": project_result.customer_id}
        ).all()
        contacts_list = [{
            "id": c.id,
            "name": c.name,
            "position": c.position,
            "phone": c.phone,
            "email": c.email,
            "role": None,
            "remark": None,
        } for c in contacts_result]
    
    tasks_result = db.execute(
        text("SELECT id, title, status, priority, due_date FROM tasks WHERE project_id = :project_id ORDER BY due_date DESC"),
        {"project_id": project_id}
    ).all()
    
    tasks_list = [{
        "id": t.id,
        "title": t.title,
        "status": t.status,
        "priority": t.priority,
        "due_date": t.due_date,
    } for t in tasks_result]
    
    activities_result = db.execute(
        text("SELECT id, content, source, activity_date FROM activities WHERE project_id = :project_id ORDER BY activity_date DESC"),
        {"project_id": project_id}
    ).all()
    
    activities_list = [{
        "id": a.id,
        "content": a.content,
        "source": a.source,
        "activity_date": a.activity_date,
    } for a in activities_result]
    
    statistics = {
        "contact_count": len(contacts_list),
        "task_count": len(tasks_list),
        "activity_count": len(activities_list),
    }
    
    return {
        "project": project_dict,
        "customer": customer_dict,
        "contacts": contacts_list,
        "tasks": tasks_list,
        "activities": activities_list,
        "statistics": statistics,
    }


@router.get("/{project_id}/contacts", response_model=List[ProjectContactOut])
def get_project_contacts(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project_contacts_result = db.execute(
        text("SELECT id, contact_id, role, remark FROM project_contacts WHERE project_id = :project_id"),
        {"project_id": project_id}
    ).all()
    
    contacts_list = []
    for pc in project_contacts_result:
        contact_result = db.execute(
            text("SELECT id, name, position, phone, email FROM contacts WHERE id = :contact_id"),
            {"contact_id": pc.contact_id}
        ).first()
        if contact_result:
            contacts_list.append({
                "id": pc.id,
                "contact_id": pc.contact_id,
                "name": contact_result.name,
                "position": contact_result.position,
                "phone": contact_result.phone,
                "email": contact_result.email,
                "role": pc.role,
                "remark": pc.remark,
            })
    
    return contacts_list


@router.post("/{project_id}/contacts", response_model=ProjectContactOut)
def add_project_contact(project_id: str, request: ProjectContactCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project_result = db.execute(
        text("SELECT id, customer_id FROM projects WHERE id = :project_id"),
        {"project_id": project_id}
    ).first()
    
    if not project_result:
        raise HTTPException(status_code=404, detail="Project not found")
    
    contact_result = db.execute(
        text("SELECT id, customer_id, name, position, phone, email FROM contacts WHERE id = :contact_id"),
        {"contact_id": request.contact_id}
    ).first()
    
    if not contact_result:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    if contact_result.customer_id != project_result.customer_id:
        raise HTTPException(status_code=403, detail="Contact does not belong to the project's customer")
    
    existing = db.execute(
        text("SELECT id FROM project_contacts WHERE project_id = :project_id AND contact_id = :contact_id"),
        {"project_id": project_id, "contact_id": request.contact_id}
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Contact already added to project")
    
    new_project_contact = ProjectContact(
        project_id=project_id,
        contact_id=request.contact_id,
        role=request.role,
        remark=request.remark,
    )
    
    db.add(new_project_contact)
    db.commit()
    db.refresh(new_project_contact)
    
    return {
        "id": new_project_contact.id,
        "contact_id": new_project_contact.contact_id,
        "name": contact_result.name,
        "position": contact_result.position,
        "phone": contact_result.phone,
        "email": contact_result.email,
        "role": new_project_contact.role,
        "remark": new_project_contact.remark,
    }


@router.delete("/{project_id}/contacts/{contact_id}")
def remove_project_contact(project_id: str, contact_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project_contact_result = db.execute(
        text("SELECT id FROM project_contacts WHERE project_id = :project_id AND contact_id = :contact_id"),
        {"project_id": project_id, "contact_id": contact_id}
    ).first()
    
    if not project_contact_result:
        raise HTTPException(status_code=404, detail="Project contact not found")
    
    db.execute(
        text("DELETE FROM project_contacts WHERE project_id = :project_id AND contact_id = :contact_id"),
        {"project_id": project_id, "contact_id": contact_id}
    )
    db.commit()
    
    return {"message": "Contact removed from project successfully"}


ALLOWED_STATUS = ["LEAD", "NEEDS_CONFIRMATION", "SOLUTION_DESIGN", "TECH_VALIDATION", "BUSINESS_NEGOTIATION", "WON", "AFTER_SALE", "LOST"]


@router.patch("/{project_id}/status", response_model=ProjectStatusUpdateOut)
def update_project_status(project_id: str, request: ProjectStatusUpdate, db: Session = Depends(get_db)):
    if request.status not in ALLOWED_STATUS:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed values: {', '.join(ALLOWED_STATUS)}")
    
    project_result = db.execute(
        text("SELECT id, name, status FROM projects WHERE id = :project_id"),
        {"project_id": project_id}
    ).first()
    
    if not project_result:
        raise HTTPException(status_code=404, detail="Project not found")
    
    old_status = project_result.status
    
    db.execute(
        text("UPDATE projects SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :project_id"),
        {"status": request.status, "project_id": project_id}
    )
    
    history = ProjectStageHistory(
        project_id=project_id,
        from_status=old_status,
        to_status=request.status,
        remark=request.remark,
    )
    db.add(history)
    
    db.commit()
    
    updated_result = db.execute(
        text("SELECT updated_at FROM projects WHERE id = :project_id"),
        {"project_id": project_id}
    ).first()
    
    return {
        "id": project_result.id,
        "name": project_result.name,
        "old_status": old_status,
        "new_status": request.status,
        "updated_at": updated_result.updated_at,
    }


@router.patch("/{project_id}/next-action")
def update_project_next_action(project_id: str, request: ProjectNextActionUpdate, db: Session = Depends(get_db)):
    project_result = db.execute(
        text("SELECT id FROM projects WHERE id = :project_id"),
        {"project_id": project_id}
    ).first()
    
    if not project_result:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.execute(
        text("UPDATE projects SET next_action = :next_action, next_action_date = :next_action_date, updated_at = CURRENT_TIMESTAMP WHERE id = :project_id"),
        {"next_action": request.next_action, "next_action_date": request.next_action_date, "project_id": project_id}
    )
    
    db.commit()
    
    return {"message": "Next action updated successfully"}


@router.get("/{project_id}/stage-history", response_model=List[ProjectStageHistoryOut])
def get_project_stage_history(project_id: str, db: Session = Depends(get_db)):
    history_result = db.execute(
        text("SELECT id, project_id, from_status, to_status, remark, created_at FROM project_stage_history WHERE project_id = :project_id ORDER BY created_at DESC"),
        {"project_id": project_id}
    ).all()
    
    return [{
        "id": h.id,
        "project_id": h.project_id,
        "from_status": h.from_status,
        "to_status": h.to_status,
        "remark": h.remark,
        "created_at": h.created_at,
    } for h in history_result]