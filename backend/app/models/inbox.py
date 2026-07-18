import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


InboxStatus = Enum("PENDING", "CONFIRMED", "ARCHIVED", name="inbox_status")


class InboxItem(Base):
    __tablename__ = "inbox_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), nullable=True)
    content = Column(String, nullable=False)
    status = Column(InboxStatus, nullable=False, default="PENDING")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<InboxItem(id={self.id}, status={self.status})>"
