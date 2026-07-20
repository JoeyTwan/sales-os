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
from ..schemas.project import ProjectCreate, ProjectOut, ProjectStatus
from ..schemas.overview import ProjectOverview
from ..utils.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectOut)
def create_project(request: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = Project(
        customer_id=str(request.customer_id),
        name=request.name,
        description=request.description,
        budget=request.budget,
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
    project.budget = request.budget
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
def get_project_overview(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project_result = db.execute(
        text("SELECT id, name, customer_id, status, budget FROM projects WHERE id = :project_id"),
        {"project_id": project_id}
    ).first()
    
    if not project_result:
        raise HTTPException(status_code=404, detail="Project not found")
    
    customer_result = db.execute(
        text("SELECT name FROM customers WHERE id = :customer_id"),
        {"customer_id": project_result.customer_id}
    ).first()
    customer_name = customer_result.name if customer_result else None
    
    project_dict = {
        "id": project_result.id,
        "name": project_result.name,
        "customer_id": project_result.customer_id,
        "customer_name": customer_name,
        "status": project_result.status,
        "budget": project_result.budget,
    }
    
    project_contacts_result = db.execute(
        text("SELECT contact_id, role, remark FROM project_contacts WHERE project_id = :project_id"),
        {"project_id": project_id}
    ).all()
    
    contact_ids = [pc.contact_id for pc in project_contacts_result]
    contacts_list = []
    
    if contact_ids:
        contacts_result = db.execute(
            text("SELECT id, name, position FROM contacts WHERE id IN :contact_ids"),
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
                    "role": pc.role,
                    "remark": pc.remark,
                })
    
    if not contacts_list:
        contacts_result = db.execute(
            text("SELECT id, name, position FROM contacts WHERE customer_id = :customer_id"),
            {"customer_id": project_result.customer_id}
        ).all()
        contacts_list = [{
            "id": c.id,
            "name": c.name,
            "position": c.position,
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
        text("SELECT content, activity_date FROM activities WHERE project_id = :project_id ORDER BY activity_date DESC"),
        {"project_id": project_id}
    ).all()
    
    activities_list = [{
        "content": a.content,
        "activity_date": a.activity_date,
    } for a in activities_result]
    
    return {
        "project": project_dict,
        "contacts": contacts_list,
        "tasks": tasks_list,
        "activities": activities_list,
    }