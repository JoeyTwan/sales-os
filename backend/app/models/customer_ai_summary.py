import uuid

from sqlalchemy import Column, Text, Date, TIMESTAMP, String, ForeignKey, Integer
from sqlalchemy.sql import func

from ..database import Base


class CustomerAISummary(Base):
    __tablename__ = "customer_ai_summary"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    
    stage = Column(String(50), nullable=True)
    budget = Column(String(50), nullable=True)
    decision_maker = Column(String(100), nullable=True)
    risk = Column(Text, nullable=True)
    next_action = Column(Text, nullable=True)
    estimated_close_date = Column(Date, nullable=True)
    confidence = Column(Integer, nullable=True, default=0)
    last_activity_summary = Column(Text, nullable=True)
    
    total_tasks = Column(Integer, nullable=True, default=0)
    completed_tasks = Column(Integer, nullable=True, default=0)
    overdue_tasks = Column(Integer, nullable=True, default=0)
    task_completion_rate = Column(Integer, nullable=True, default=0)
    
    last_generated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())