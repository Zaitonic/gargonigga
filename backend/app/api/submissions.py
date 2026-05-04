"""Submission endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from app.database import get_db
from app.models.user import User
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.schemas.submission import GradeRequest
from app.security import get_current_user, require_role
from app.utils.constants import ROLE_STUDENT, ROLE_INSTRUCTOR, ROLE_ADMIN
from app.utils.file_handler import save_upload_file

router = APIRouter()


@router.post("/{assignment_id}/submit")
async def submit_assignment(assignment_id: int, file: UploadFile = File(...),
                            db: Session = Depends(get_db),
                            current_user: User = Depends(require_role(ROLE_STUDENT))):
    a = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not a: raise HTTPException(404, "Assignment not found.")
    existing = db.query(Submission).filter(Submission.assignment_id == assignment_id,
                                           Submission.student_id == current_user.id).first()
    if existing: raise HTTPException(400, "You have already submitted this assignment.")
    file_path, original_name = await save_upload_file(file, current_user.id, a.course_code)
    sub = Submission(assignment_id=assignment_id, student_id=current_user.id,
                     file_path=file_path, file_original_name=original_name)
    db.add(sub); db.commit(); db.refresh(sub)
    return {"success": True, "data": {
        "id": sub.id, "assignment_id": sub.assignment_id, "student_id": sub.student_id,
        "file_name": sub.file_original_name, "grade": None, "feedback": None,
        "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
    }}


@router.get("/{assignment_id}/my-submission")
def get_my_submission(assignment_id: int, db: Session = Depends(get_db),
                      current_user: User = Depends(require_role(ROLE_STUDENT))):
    sub = db.query(Submission).filter(Submission.assignment_id == assignment_id,
                                      Submission.student_id == current_user.id).first()
    if not sub: raise HTTPException(404, detail="No submission found for this assignment")
    return {"success": True, "data": {
        "id": sub.id, "file_name": sub.file_original_name, "grade": sub.grade,
        "feedback": sub.feedback,
        "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
        "graded_at": sub.graded_at.isoformat() if sub.graded_at else None,
    }}


@router.patch("/{submission_id}/grade")
def grade_submission(submission_id: int, req: GradeRequest, db: Session = Depends(get_db),
                     current_user: User = Depends(require_role(ROLE_INSTRUCTOR, ROLE_ADMIN))):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub: raise HTTPException(404, "Submission not found.")
    a = db.query(Assignment).filter(Assignment.id == sub.assignment_id).first()
    if req.grade < 0 or req.grade > a.max_points:
        raise HTTPException(400, f"Grade must be between 0 and {a.max_points}.")
    sub.grade = req.grade
    sub.feedback = req.feedback
    sub.graded_at = datetime.utcnow()
    db.commit(); db.refresh(sub)
    student = db.query(User).filter(User.id == sub.student_id).first()
    return {"success": True, "data": {
        "id": sub.id, "student_id": sub.student_id,
        "student_name": student.name if student else "Unknown",
        "file_name": sub.file_original_name, "grade": sub.grade, "feedback": sub.feedback,
        "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
        "graded_at": sub.graded_at.isoformat() if sub.graded_at else None,
    }}


@router.get("/{submission_id}/file")
def download_submission(submission_id: int, db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub: raise HTTPException(404, "Submission not found.")
    if not os.path.exists(sub.file_path): raise HTTPException(404, "File not found on server.")
    return FileResponse(sub.file_path, filename=sub.file_original_name)
