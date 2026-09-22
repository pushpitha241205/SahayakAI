from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.emergency import Emergency
from backend.models.incident import Incident
from backend.schemas.emergency import EmergencyOut, IncidentOut
from backend.utils.auth import get_current_user

router = APIRouter(prefix="/api/incidents", tags=["Incident History"])

@router.get("", response_model=List[EmergencyOut])
def get_user_incidents_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns complete emergency history for the authenticated user,
    including severity, status, location, and AI incident logs.
    """
    emergencies = db.query(Emergency).filter(
        Emergency.user_id == current_user.id
    ).order_by(Emergency.created_at.desc()).all()
    
    return emergencies

@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident_detail(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).join(Emergency).filter(
        Incident.id == incident_id,
        Emergency.user_id == current_user.id
    ).first()
    
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident record not found."
        )
    return incident
