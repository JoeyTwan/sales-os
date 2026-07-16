import uuid

from sqlalchemy import Column, Text, Date, TIMESTAMP, String, Enum, ForeignKey
from sqlalchemy.sql import func

from ..database import Base

ActivitySource = Enum("capture", "manual", "email", "meeting", name="activity_source")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    source = Column(ActivitySource, nullable=False, default="manual")
    activity_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
