"""Announcement endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.announcement import Announcement
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate
from app.security import get_current_user, require_role
from app.utils.constants import *

router = APIRouter()


def ann_to_dict(a, db):
    author = db.query(User).filter(User.id == a.author_id).first()
    return {
        "id": a.id, "title": a.title, "body": a.body,
        "type": a.announcement_type, "color": a.color,
        "target_audience": a.target_audience, "author_id": a.author_id,
        "author_name": author.name if author else "Unknown",
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.get("")
def list_announcements(page: int = Query(1, ge=1), per_page: int = Query(20),
                       type: str = Query(None), search: str = Query(None),
                       db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Announcement)
    # Role-based filtering
    if current_user.role == ROLE_STUDENT:
        query = query.filter(Announcement.target_audience.in_([TARGET_ALL, TARGET_STUDENTS]))
    elif current_user.role == ROLE_INSTRUCTOR:
        query = query.filter(Announcement.target_audience.in_([TARGET_ALL, TARGET_FACULTY]))
    if type:
        query = query.filter(Announcement.announcement_type == type)
    if search:
        query = query.filter((Announcement.title.ilike(f"%{search}%")) | (Announcement.body.ilike(f"%{search}%")))
    total = query.count()
    anns = query.order_by(Announcement.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {"success": True, "data": {"items": [ann_to_dict(a, db) for a in anns], "total": total, "page": page}}


@router.post("")
def create_announcement(req: AnnouncementCreate, db: Session = Depends(get_db),
                        current_user: User = Depends(require_role(ROLE_ADMIN, ROLE_INSTRUCTOR))):
    color = ANNOUNCEMENT_TYPE_COLORS.get(req.type, "slate")
    ann = Announcement(author_id=current_user.id, title=req.title, body=req.body,
                       announcement_type=req.type, color=color, target_audience=req.target_audience or TARGET_ALL)
    db.add(ann); db.commit(); db.refresh(ann)
    return {"success": True, "data": ann_to_dict(ann, db)}


@router.patch("/{ann_id}")
def update_announcement(ann_id: int, req: AnnouncementUpdate, db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann: raise HTTPException(404, "Announcement not found.")
    if current_user.role != ROLE_ADMIN and ann.author_id != current_user.id:
        raise HTTPException(403, "Access denied.")
    if req.title: ann.title = req.title
    if req.body: ann.body = req.body
    if req.type:
        ann.announcement_type = req.type
        ann.color = ANNOUNCEMENT_TYPE_COLORS.get(req.type, ann.color)
    db.commit(); db.refresh(ann)
    return {"success": True, "data": ann_to_dict(ann, db)}


@router.delete("/{ann_id}")
def delete_announcement(ann_id: int, db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann: raise HTTPException(404, "Announcement not found.")
    if current_user.role != ROLE_ADMIN and ann.author_id != current_user.id:
        raise HTTPException(403, "Access denied.")
    db.delete(ann); db.commit()
    return {"success": True, "message": "Announcement deleted"}
