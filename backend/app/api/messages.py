"""Message endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.message import Message
from app.schemas.message import MessageCreate
from app.security import get_current_user

router = APIRouter()


def msg_to_dict(msg, db):
    sender = db.query(User).filter(User.id == msg.from_id).first()
    recipient = db.query(User).filter(User.id == msg.to_id).first()
    return {
        "id": msg.id, "from_id": msg.from_id,
        "from_name": sender.name if sender else "Unknown",
        "to_id": msg.to_id, "to_name": recipient.name if recipient else "Unknown",
        "subject": msg.subject, "body": msg.body, "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


@router.get("/inbox")
def get_inbox(page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100),
              unread_only: bool = Query(False), db: Session = Depends(get_db),
              current_user: User = Depends(get_current_user)):
    query = db.query(Message).filter(Message.to_id == current_user.id)
    if unread_only:
        query = query.filter(Message.is_read == False)
    total = query.count()
    unread = db.query(Message).filter(Message.to_id == current_user.id, Message.is_read == False).count()
    msgs = query.order_by(Message.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {"success": True, "data": {"items": [msg_to_dict(m, db) for m in msgs], "total": total, "page": page, "unread_count": unread}}


@router.get("/sent")
def get_sent(page: int = Query(1, ge=1), per_page: int = Query(20), db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    query = db.query(Message).filter(Message.from_id == current_user.id)
    total = query.count()
    msgs = query.order_by(Message.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {"success": True, "data": {"items": [msg_to_dict(m, db) for m in msgs], "total": total, "page": page}}


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Message).filter(Message.to_id == current_user.id, Message.is_read == False).count()
    return {"success": True, "data": {"unread_count": c}}


@router.get("/{message_id}")
def get_message(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg: raise HTTPException(404, "Message not found.")
    if msg.to_id != current_user.id and msg.from_id != current_user.id: raise HTTPException(403, "Access denied.")
    if msg.to_id == current_user.id and not msg.is_read:
        msg.is_read = True; db.commit()
    return {"success": True, "data": msg_to_dict(msg, db)}


@router.post("")
def send_message(req: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not db.query(User).filter(User.id == req.to_id).first(): raise HTTPException(404, "Recipient not found.")
    msg = Message(from_id=current_user.id, to_id=req.to_id, subject=req.subject, body=req.body)
    db.add(msg); db.commit(); db.refresh(msg)
    return {"success": True, "data": msg_to_dict(msg, db)}


@router.patch("/{message_id}/read")
def mark_read(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(Message).filter(Message.id == message_id, Message.to_id == current_user.id).first()
    if not msg: raise HTTPException(404, "Message not found.")
    msg.is_read = True; db.commit()
    return {"success": True, "message": "Message marked as read"}


@router.delete("/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg: raise HTTPException(404, "Message not found.")
    if msg.to_id != current_user.id and msg.from_id != current_user.id: raise HTTPException(403, "Access denied.")
    db.delete(msg); db.commit()
    return {"success": True, "message": "Message deleted"}
