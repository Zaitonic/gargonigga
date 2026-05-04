"""Schedule endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.schedule import Schedule
from app.schemas.schedule import ScheduleCreate
from app.security import get_current_user

router = APIRouter()


def sched_to_dict(s):
    return {
        "id": s.id, "course_code": s.course_code, "course_label": s.course_label,
        "day_of_week": s.day_of_week, "start_time": s.start_time, "end_time": s.end_time,
        "room_location": s.room_location, "section_or_instructor": s.section_or_instructor,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


@router.get("")
def get_schedule(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(Schedule).filter(Schedule.user_id == current_user.id).all()
    return {"success": True, "data": [sched_to_dict(s) for s in items]}


@router.post("")
def add_schedule(req: ScheduleCreate, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    s = Schedule(user_id=current_user.id, course_code=req.course_code, course_label=req.course_label,
                 day_of_week=req.day_of_week, start_time=req.start_time, end_time=req.end_time,
                 room_location=req.room_location, section_or_instructor=req.section_or_instructor)
    db.add(s); db.commit(); db.refresh(s)
    return {"success": True, "data": sched_to_dict(s)}


@router.delete("/{schedule_id}")
def remove_schedule(schedule_id: int, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    s = db.query(Schedule).filter(Schedule.id == schedule_id, Schedule.user_id == current_user.id).first()
    if not s: raise HTTPException(404, "Schedule not found.")
    db.delete(s); db.commit()
    return {"success": True, "message": "Schedule deleted"}
