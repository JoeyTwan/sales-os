import uuid

from sqlalchemy import Column, Text, Date, TIMESTAMP, String, Enum
from sqlalchemy.sql import func

from ..database import Base

CustomerLevel = Enum("HIGH", "MEDIUM", "LOW", name="customer_level")
CustomerStatus = Enum("PROSPECT", "CUSTOMER", "PAUSED", "LOST", name="customer_status")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    name = Column(String(255), nullable=False)
    level = Column(CustomerLevel, nullable=False)
    status = Column(CustomerStatus, nullable=False)
    summary = Column(Text, nullable=True)
    next_action = Column(Text, nullable=True)
    next_action_date = Column(Date, nullable=True)
    last_activity_date = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())