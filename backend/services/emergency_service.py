from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.models.emergency import Emergency
from backend.models.incident import Incident
from backend.models.user import User
from backend.schemas.emergency import EmergencyCreate
from backend.services.ai_service import AIService
from backend.services.notification_service import NotificationService
from backend.services.location_service import LocationService

class EmergencyService:
    
    @staticmethod
    def create_emergency(db: Session, user: User, data: EmergencyCreate) -> Dict[str, Any]:
        # 1. Analyze description with AI if provided
        ai_result = None
        emergency_type = data.emergency_type or "General Emergency"
        severity = data.severity or "HIGH"
        
        if data.description and len(data.description.strip()) > 3:
            ai_result = AIService.analyze_emergency(data.description)
            emergency_type = ai_result["emergency_type"]
            severity = ai_result["severity"]

        # 2. Store Emergency in Database
        emergency = Emergency(
            user_id=user.id,
            emergency_type=emergency_type,
            severity=severity,
            description=data.description,
            latitude=data.latitude,
            longitude=data.longitude,
            status="ACTIVE",
            created_at=datetime.utcnow()
        )
        db.add(emergency)
        db.commit()
        db.refresh(emergency)

        # 3. Create Incident Record
        incident = None
        if ai_result:
            keywords_str = ", ".join(ai_result.get("detected_keywords", []))
            guidance_str = "\n".join(ai_result.get("immediate_guidance", []))
            incident = Incident(
                emergency_id=emergency.id,
                ai_analysis=ai_result.get("explanation", "AI analyzed the urgent situation."),
                detected_keywords=keywords_str,
                recommended_action=guidance_str,
                created_at=datetime.utcnow()
            )
            db.add(incident)
            db.commit()
            db.refresh(incident)

        # 4. Notify User's Emergency Contacts
        contacts = user.contacts
        notification_results = NotificationService.notify_emergency_contacts(
            user_name=user.name,
            contacts=contacts,
            emergency_type=emergency_type,
            severity=severity,
            latitude=data.latitude,
            longitude=data.longitude,
            description=data.description
        )

        # 5. Get nearby services
        nearby_services = []
        if data.latitude and data.longitude:
            nearby_services = LocationService.get_nearby_services(data.latitude, data.longitude)

        return {
            "emergency": emergency,
            "incident": incident,
            "ai_result": ai_result,
            "notifications_sent": len(notification_results),
            "nearby_services": nearby_services,
            "emergency_numbers": LocationService.get_emergency_numbers()
        }

    @staticmethod
    def resolve_emergency(db: Session, emergency_id: int, user_id: int, notes: Optional[str] = None) -> Emergency:
        emergency = db.query(Emergency).filter(Emergency.id == emergency_id, Emergency.user_id == user_id).first()
        if not emergency:
            return None
        emergency.status = "RESOLVED"
        emergency.resolved_at = datetime.utcnow()
        if notes:
            emergency.description = f"{emergency.description or ''}\n[Resolution Notes]: {notes}".strip()
        db.commit()
        db.refresh(emergency)
        return emergency
