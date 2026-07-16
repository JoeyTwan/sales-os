import uuid

from sqlalchemy import Column, Text, String, Enum, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func

from ..database import Base

ProjectStatus = Enum("LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", name="project_status")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    budget = Column(Integer, nullable=True)
    status = Column(ProjectStatus, nullable=False, default="LEAD")
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())