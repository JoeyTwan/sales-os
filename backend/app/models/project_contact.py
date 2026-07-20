import uuid

from sqlalchemy import Column, Text, String, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func

from ..database import Base


class ProjectContact(Base):
    __tablename__ = "project_contacts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    contact_id = Column(String(36), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(100), nullable=True)
    remark = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())