from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from ..database import get_db
from ..models.project import Project
from ..schemas.project import ProjectCreate, ProjectOut, ProjectStatus
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