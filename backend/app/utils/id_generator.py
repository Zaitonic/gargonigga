"""User ID generation utilities."""

from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.constants import ROLE_STUDENT, ROLE_ADMIN, ROLE_INSTRUCTOR
from datetime import datetime


def generate_user_id(db: Session, role: str) -> str:
    """Generate the next user ID based on role.

    Format:
    - Admin:      ADM-00001
    - Instructor:  INS-00001
    - Student:     STU{YY}-00001  (e.g., STU26-00001)
    """
    year = datetime.now().strftime("%y")

    if role == ROLE_STUDENT:
        prefix = f"STU{year}"
    elif role == ROLE_ADMIN:
        prefix = "ADM"
    elif role == ROLE_INSTRUCTOR:
        prefix = "INS"
    else:
        raise ValueError(f"Invalid role: {role}")

    # Find the highest existing ID with this prefix
    existing = (
        db.query(User.id)
        .filter(User.id.like(f"{prefix}-%"))
        .all()
    )

    if existing:
        nums = []
        for (uid,) in existing:
            try:
                num = int(uid.split("-")[-1])
                nums.append(num)
            except ValueError:
                continue
        next_num = max(nums) + 1 if nums else 1
    else:
        next_num = 1

    return f"{prefix}-{str(next_num).zfill(5)}"
