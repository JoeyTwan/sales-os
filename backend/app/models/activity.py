import uuid

from sqlalchemy import Column, Text, Date, TIMESTAMP, String, Enum, ForeignKey
from sqlalchemy.sql import func

from ..database import Base
from .customer import Customer

ActivityType = Enum("VISIT", "CALL", "WECHAT", "MEETING", "EMAIL", "NOTE", name="activity_type")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    type = Column(ActivityType, nullable=False)
    content = Column(Text, nullable=False)
    activity_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
