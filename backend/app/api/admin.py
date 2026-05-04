"""Admin endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.message import Message
from app.models.announcement import Announcement
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.schedule import Schedule
from app.models.user_preference import UserPreference
from app.models.password_reset_token import PasswordResetToken
from app.security import require_role
from app.utils.constants import ROLE_ADMIN, ROLE_STUDENT, ROLE_INSTRUCTOR
from app.seed.default_data import *

router = APIRouter()


@router.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db),
                    current_user: User = Depends(require_role(ROLE_ADMIN))):
    unread = db.query(Message).filter(Message.to_id == current_user.id, Message.is_read == False).count()
    return {"success": True, "data": {
        "unread_messages": unread,
        "total_users": db.query(User).count(),
        "total_announcements": db.query(Announcement).count(),
        "system_status": "online",
        "total_students": db.query(User).filter(User.role == ROLE_STUDENT).count(),
        "total_instructors": db.query(User).filter(User.role == ROLE_INSTRUCTOR).count(),
        "total_admins": db.query(User).filter(User.role == ROLE_ADMIN).count(),
    }}


@router.post("/reset-data")
def reset_data(db: Session = Depends(get_db),
               current_user: User = Depends(require_role(ROLE_ADMIN))):
    """Reset all data to defaults (DEMO only)."""
    # Clear all tables
    db.query(PasswordResetToken).delete()
    db.query(Submission).delete()
    db.query(Assignment).delete()
    db.query(Schedule).delete()
    db.query(Message).delete()
    db.query(Announcement).delete()
    db.query(UserPreference).delete()
    db.query(User).delete()
    db.commit()

    # Re-seed
    for u in get_default_users():
        db.add(User(**u))
    db.commit()
    for a in get_default_announcements():
        db.add(Announcement(**a))
    for m in get_default_messages():
        db.add(Message(**m))
    for a in get_default_assignments():
        db.add(Assignment(**a))
    db.commit()
    for s in get_default_submissions():
        db.add(Submission(**s))
    for sc in get_default_schedules():
        db.add(Schedule(**sc))
    for p in get_default_preferences():
        db.add(UserPreference(**p))
    db.commit()

    return {"success": True, "message": "All data reset to defaults"}
