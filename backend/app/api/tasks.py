from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date
from typing import List

from ..database import get_db
from ..models.task import Task
from ..schemas.task import TaskCreate, TaskUpdate, TaskOut

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("", response_model=TaskOut)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("", response_model=List[TaskOut])
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(desc(Task.due_date), desc(Task.created_at)).all()
    return tasks


@router.get("/today", response_model=List[TaskOut])
def get_today_tasks(db: Session = Depends(get_db)):
    today = date.today()
    tasks = (
        db.query(Task)
        .filter(Task.due_date == today)
        .order_by(Task.priority.desc(), Task.created_at)
        .all()
    )
    return tasks


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: str, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    return task
