import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, JSON
from sqlalchemy.sql import func

from app.database import Base


SuggestionStatus = Enum("PENDING", "CONFIRMED", "CANCELLED", name="suggestion_status")


class AISuggestion(Base):
    __tablename__ = "ai_suggestions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(SuggestionStatus, nullable=False, default="PENDING")
    raw_content = Column(String, nullable=False)
    suggestion_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<AISuggestion(id={self.id}, status={self.status})>"