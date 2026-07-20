from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, select
from datetime import date
from typing import List

from ..database import get_db
from ..models.task import Task
from ..models.customer import Customer
from ..models.project import Project
from ..schemas.task import TaskCreate, TaskUpdate, TaskOut
from ..utils.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("", response_model=TaskOut)
def create_task(task: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def _enrich_task_with_names(task: Task, db: Session) -> dict:
    task_dict = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "due_date": task.due_date,
        "customer_id": task.customer_id,
        "project_id": task.project_id,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "customer_name": None,
        "project_name": None,
    }
    
    if task.customer_id:
        customer = db.query(Customer).filter(Customer.id == task.customer_id).first()
        if customer:
            task_dict["customer_name"] = customer.name
    
    if task.project_id:
        project = db.query(Project).filter(Project.id == task.project_id).first()
        if project:
            task_dict["project_name"] = project.name
    
    return task_dict


@router.get("", response_model=List[TaskOut])
def get_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = db.query(Task).order_by(desc(Task.due_date), desc(Task.created_at)).all()
    return [_enrich_task_with_names(task, db) for task in tasks]


@router.get("/today", response_model=List[TaskOut])
def get_today_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    tasks = (
        db.query(Task)
        .filter(Task.due_date == today)
        .order_by(Task.priority.desc(), Task.created_at)
        .all()
    )
    return [_enrich_task_with_names(task, db) for task in tasks]


@router.get("/customer/{customer_id}", response_model=List[TaskOut])
def get_customer_tasks(customer_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = (
        db.query(Task)
        .filter(Task.customer_id == customer_id)
        .order_by(desc(Task.due_date), desc(Task.created_at))
        .all()
    )
    return [_enrich_task_with_names(task, db) for task in tasks]


@router.get("/project/{project_id}", response_model=List[TaskOut])
def get_project_tasks(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .order_by(desc(Task.due_date), desc(Task.created_at))
        .all()
    )
    return [_enrich_task_with_names(task, db) for task in tasks]


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: str, task_update: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    return task
