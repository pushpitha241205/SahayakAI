from typing import List, Dict, Any
from sqlalchemy import func
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.emergency import Emergency
from backend.models.incident import Incident
from backend.schemas.emergency import EmergencyOut
from backend.utils.auth import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

@router.get("/statistics")
def get_admin_statistics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    total_users = db.query(User).count()
    total_emergencies = db.query(Emergency).count()
    active_emergencies = db.query(Emergency).filter(Emergency.status == "ACTIVE").count()
    resolved_emergencies = db.query(Emergency).filter(Emergency.status == "RESOLVED").count()
    
    # Group by category
    categories_count = db.query(
        Emergency.emergency_type, func.count(Emergency.id)
    ).group_by(Emergency.emergency_type).all()
    
    category_breakdown = {cat: count for cat, count in categories_count}

    # Group by severity
    severity_count = db.query(
        Emergency.severity, func.count(Emergency.id)
    ).group_by(Emergency.severity).all()
    
    severity_breakdown = {sev: count for sev, count in severity_count}

    return {
        "total_users": total_users,
        "total_emergencies": total_emergencies,
        "active_emergencies": active_emergencies,
        "resolved_emergencies": resolved_emergencies,
        "category_breakdown": category_breakdown,
        "severity_breakdown": severity_breakdown
    }

@router.get("/emergencies", response_model=List[EmergencyOut])
def get_all_emergencies(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """
    Returns all emergencies across the entire system for administrative review.
    Does not expose sensitive passwords or private credentials.
    """
    emergencies = db.query(Emergency).order_by(Emergency.created_at.desc()).limit(100).all()
    return emergencies

@router.get("/users")
def get_all_users_admin(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "created_at": u.created_at,
            "contact_count": len(u.contacts),
            "emergency_count": len(u.emergencies)
        }
        for u in users
    ]
