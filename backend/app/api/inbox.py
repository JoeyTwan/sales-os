from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.inbox import InboxItem
from app.schemas.inbox import InboxItemCreate, InboxItemUpdate, InboxItemOut
from ..utils.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/inbox", tags=["inbox"])


@router.post("", response_model=InboxItemOut)
def create_inbox_item(item: InboxItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_item = InboxItem(content=item.content)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("", response_model=list[InboxItemOut])
def get_inbox_items(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(InboxItem).order_by(InboxItem.created_at.desc()).all()
    return items


@router.patch("/{id}", response_model=InboxItemOut)
def update_inbox_item(id: UUID, item: InboxItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_item = db.query(InboxItem).filter(InboxItem.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inbox item not found")
    db_item.status = item.status.value
    db.commit()
    db.refresh(db_item)
    return db_item
