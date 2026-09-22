from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.emergency import Emergency
from backend.schemas.emergency import (
    EmergencyCreate,
    EmergencyOut,
    EmergencyAnalyzeRequest,
    AIAnalysisResult,
    EmergencyResolveRequest
)
from backend.services.ai_service import AIService
from backend.services.emergency_service import EmergencyService
from backend.services.location_service import LocationService
from backend.utils.auth import get_current_user

router = APIRouter(prefix="/api/emergency", tags=["Emergency Operations"])

@router.post("/analyze", response_model=AIAnalysisResult)
def analyze_emergency_text(request: EmergencyAnalyzeRequest):
    """
    AI emergency detection from text or transcribed voice.
    Classifies situation into emergency type, severity, safety guidance, and missing info.
    """
    result = AIService.analyze_emergency(request.description, language=request.language or "en")
    return result

@router.post("/create", status_code=status.HTTP_201_CREATED)
def trigger_emergency_sos(
    data: EmergencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers an emergency SOS:
    1. Stores record in database
    2. Runs AI analysis on description
    3. Queues alerts to user's registered emergency contacts
    4. Computes nearest emergency response stations
    """
    result = EmergencyService.create_emergency(db=db, user=current_user, data=data)
    emergency = result["emergency"]
    
    return {
        "emergency_id": emergency.id,
        "user_id": emergency.user_id,
        "emergency_type": emergency.emergency_type,
        "severity": emergency.severity,
        "status": emergency.status,
        "latitude": emergency.latitude,
        "longitude": emergency.longitude,
        "created_at": emergency.created_at,
        "notifications_sent": result["notifications_sent"],
        "ai_result": result["ai_result"],
        "nearby_services": result["nearby_services"],
        "emergency_numbers": result["emergency_numbers"],
        "message": f"SOS Alert active. Notified {result['notifications_sent']} emergency contacts."
    }

@router.get("/active")
def get_user_active_emergency(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emergency = db.query(Emergency).filter(
        Emergency.user_id == current_user.id,
        Emergency.status == "ACTIVE"
    ).order_by(Emergency.created_at.desc()).first()
    
    if not emergency:
        return {"active": False, "emergency": None}
        
    return {
        "active": True,
        "emergency": {
            "id": emergency.id,
            "emergency_type": emergency.emergency_type,
            "severity": emergency.severity,
            "description": emergency.description,
            "latitude": emergency.latitude,
            "longitude": emergency.longitude,
            "status": emergency.status,
            "created_at": emergency.created_at
        }
    }

@router.get("/{emergency_id}", response_model=EmergencyOut)
def get_emergency_details(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emergency = db.query(Emergency).filter(
        Emergency.id == emergency_id,
        Emergency.user_id == current_user.id
    ).first()
    
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency incident not found."
        )
    return emergency

@router.put("/{emergency_id}/resolve")
def resolve_emergency(
    emergency_id: int,
    data: EmergencyResolveRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notes = data.resolution_notes if data else "Resolved by user"
    resolved = EmergencyService.resolve_emergency(
        db=db,
        emergency_id=emergency_id,
        user_id=current_user.id,
        notes=notes
    )
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency incident not found or already resolved."
        )
    return {"message": "Emergency successfully marked as RESOLVED.", "status": "RESOLVED"}

@router.get("/numbers/helplines")
def get_helplines():
    return LocationService.get_emergency_numbers()
