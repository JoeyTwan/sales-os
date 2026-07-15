import uuid

from sqlalchemy import Column, Text, Date, TIMESTAMP, String, Enum
from sqlalchemy.sql import func

from ..database import Base

TaskStatus = Enum("TODO", "DOING", "DONE", name="task_status")
TaskPriority = Enum("HIGH", "MEDIUM", "LOW", name="task_priority")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(TaskStatus, nullable=False, default="TODO")
    priority = Column(TaskPriority, nullable=False, default="MEDIUM")
    due_date = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
