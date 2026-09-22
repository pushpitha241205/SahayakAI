from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ContactBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)
    relationship: str = Field(..., min_length=2, max_length=50)

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    relationship: Optional[str] = Field(None, min_length=2, max_length=50)

class ContactOut(ContactBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
