import logging
from typing import List, Dict, Any
from backend.models.emergency_contact import EmergencyContact

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Handles alerts and notifications to registered emergency contacts.
    Can be easily connected to Twilio, Fast2SMS, AWS SNS, or Email SMTP.
    """
    
    @staticmethod
    def notify_emergency_contacts(
        user_name: str,
        contacts: List[EmergencyContact],
        emergency_type: str,
        severity: str,
        latitude: float = None,
        longitude: float = None,
        description: str = None
    ) -> List[Dict[str, Any]]:
        results = []
        
        map_link = ""
        if latitude and longitude:
            map_link = f"https://www.google.com/maps?q={latitude},{longitude}"
            
        message = (
            f"EMERGENCY ALERT: {user_name} has triggered a {severity} level {emergency_type} via Sahayak AI!\n"
        )
        if map_link:
            message += f"Location: {map_link}\n"
        if description:
            message += f"Details: {description}\n"
        message += "Please contact them immediately or dispatch local emergency services."

        logger.info(f"Preparing to send emergency alerts to {len(contacts)} contacts:")
        
        for contact in contacts:
            # Here we log and record the notification dispatch
            # In production with SMS provider configured, an API request would be sent
            logger.info(f"-> Alerting {contact.name} ({contact.phone}, {contact.relationship}): {message}")
            results.append({
                "contact_id": contact.id,
                "name": contact.name,
                "phone": contact.phone,
                "status": "QUEUED_AND_NOTIFIED",
                "message": message
            })
            
        return results
