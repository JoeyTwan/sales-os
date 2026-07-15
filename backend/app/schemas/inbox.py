from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from enum import Enum


class InboxStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    ARCHIVED = "ARCHIVED"


class InboxItemCreate(BaseModel):
    content: str


class InboxItemUpdate(BaseModel):
    status: InboxStatus


class InboxItemOut(BaseModel):
    id: UUID
    content: str
    status: InboxStatus
    created_at: datetime

    class Config:
        orm_mode = True
