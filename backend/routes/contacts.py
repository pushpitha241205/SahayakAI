from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.emergency_contact import EmergencyContact
from backend.schemas.contact import ContactCreate, ContactUpdate, ContactOut
from backend.utils.auth import get_current_user

router = APIRouter(prefix="/api/contacts", tags=["Emergency Contacts"])

@router.get("", response_model=List[ContactOut])
def get_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(EmergencyContact).filter(EmergencyContact.user_id == current_user.id).all()

@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(
    contact_data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = EmergencyContact(
        user_id=current_user.id,
        name=contact_data.name.strip(),
        phone=contact_data.phone.strip(),
        relationship_type=contact_data.relationship.strip()
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: int,
    contact_data: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found."
        )

    if contact_data.name is not None:
        contact.name = contact_data.name.strip()
    if contact_data.phone is not None:
        contact.phone = contact_data.phone.strip()
    if contact_data.relationship is not None:
        contact.relationship_type = contact_data.relationship.strip()

    db.commit()
    db.refresh(contact)
    return contact

@router.delete("/{contact_id}", status_code=status.HTTP_200_OK)
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found."
        )

    db.delete(contact)
    db.commit()
    return {"message": "Emergency contact deleted successfully."}
