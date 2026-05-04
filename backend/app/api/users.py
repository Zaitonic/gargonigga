"""User endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserUpdate, AdminUserUpdate, UserResponse,
    ChangePasswordRequest, UserListItem,
)
from app.security import get_current_user, verify_password, hash_password, require_role
from app.utils.id_generator import generate_user_id
from app.utils.constants import ROLE_ADMIN, ALL_ROLES

router = APIRouter()


def user_to_response(user: User) -> dict:
    """Convert User model to response dict."""
    return {
        "id": user.id,
        "name": user.name,
        "role": user.role,
        "email": user.email,
        "phone": user.phone,
        "avatar": user.avatar,
        "bio": user.bio,
        "department_section": user.department_section,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }


@router.get("/contacts")
def list_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all active users as contacts (for compose message picker)."""
    users = db.query(User).filter(User.is_active == True, User.id != current_user.id).all()
    return {
        "success": True,
        "data": [
            {"id": u.id, "name": u.name, "role": u.role, "avatar": u.avatar, "department_section": u.department_section}
            for u in users
        ],
    }


@router.get("/me")
def get_current_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return {"success": True, "data": user_to_response(current_user)}


@router.patch("/me")
def update_profile(
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user profile."""
    if update.name is not None:
        current_user.name = update.name
        # Update avatar from name initials
        parts = update.name.split()
        current_user.avatar = "".join(p[0] for p in parts[:2]).upper()
    if update.email is not None:
        current_user.email = update.email
    if update.phone is not None:
        current_user.phone = update.phone
    if update.bio is not None:
        current_user.bio = update.bio
    if update.department_section is not None:
        current_user.department_section = update.department_section

    db.commit()
    db.refresh(current_user)
    return {"success": True, "data": user_to_response(current_user)}


@router.post("/me/change-password")
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change current user password."""
    if not current_user.password_hash:
        raise HTTPException(status_code=400, detail="Cannot change password for OAuth accounts. Use your social login provider.")

    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    current_user.password_hash = hash_password(request.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully"}


@router.get("/{user_id}")
def get_user_by_id(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user by ID (admin/instructor view)."""
    user = db.query(User).filter(User.id == user_id.upper()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"success": True, "data": user_to_response(user)}


@router.get("")
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: str = Query(None),
    search: str = Query(None),
    is_active: bool = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ROLE_ADMIN)),
):
    """List all users (admin only)."""
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_term))
            | (User.id.ilike(search_term))
            | (User.email.ilike(search_term))
        )

    total = query.count()
    users = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "success": True,
        "data": {
            "items": [user_to_response(u) for u in users],
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        },
    }


@router.post("")
def create_user(
    request: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ROLE_ADMIN)),
):
    """Create a new user (admin only)."""
    if request.role not in ALL_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role: {request.role}")

    new_id = generate_user_id(db, request.role)
    name = f"{request.first_name} {request.last_name}"
    avatar = (request.first_name[0] + request.last_name[0]).upper()

    user = User(
        id=new_id,
        password_hash=hash_password(request.password),
        name=name,
        role=request.role,
        email=request.email or None,
        phone=request.phone or None,
        department_section=request.department_section,
        avatar=avatar,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "data": user_to_response(user),
        "message": "User created successfully",
    }


@router.patch("/{user_id}")
def update_user(
    user_id: str,
    request: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ROLE_ADMIN)),
):
    """Update a user (admin only)."""
    user = db.query(User).filter(User.id == user_id.upper()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if request.name is not None:
        user.name = request.name
        parts = request.name.split()
        user.avatar = "".join(p[0] for p in parts[:2]).upper()
    if request.email is not None:
        user.email = request.email
    if request.phone is not None:
        user.phone = request.phone
    if request.department_section is not None:
        user.department_section = request.department_section
    if request.password:
        user.password_hash = hash_password(request.password)

    db.commit()
    db.refresh(user)
    return {"success": True, "data": user_to_response(user)}


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ROLE_ADMIN)),
):
    """Delete a user (admin only)."""
    if user_id.upper() == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account.")

    user = db.query(User).filter(User.id == user_id.upper()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    db.delete(user)
    db.commit()
    return {"success": True, "message": "User deleted successfully"}
