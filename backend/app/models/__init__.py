"""SQLAlchemy models for AcadSync."""

from app.models.user import User
from app.models.message import Message
from app.models.announcement import Announcement
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.schedule import Schedule
from app.models.user_preference import UserPreference
from app.models.password_reset_token import PasswordResetToken

__all__ = [
    "User",
    "Message",
    "Announcement",
    "Assignment",
    "Submission",
    "Schedule",
    "UserPreference",
    "PasswordResetToken",
]
