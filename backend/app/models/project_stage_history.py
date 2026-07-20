import uuid

from sqlalchemy import Column, Text, String, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func

from ..database import Base


class ProjectStageHistory(Base):
    __tablename__ = "project_stage_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    remark = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())