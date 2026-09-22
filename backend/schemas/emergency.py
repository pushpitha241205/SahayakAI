from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class EmergencyCreate(BaseModel):
    emergency_type: Optional[str] = "General Emergency"
    severity: Optional[str] = "HIGH"
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class EmergencyAnalyzeRequest(BaseModel):
    description: str = Field(..., min_length=2)
    language: Optional[str] = "en" # 'en', 'te', etc.

class AIAnalysisResult(BaseModel):
    emergency_type: str
    severity: str
    immediate_guidance: List[str]
    information_needed: List[str]
    detected_keywords: List[str]
    explanation: str

class IncidentOut(BaseModel):
    id: int
    emergency_id: int
    ai_analysis: str
    detected_keywords: Optional[str] = None
    recommended_action: str
    created_at: datetime

    class Config:
        from_attributes = True

class EmergencyOut(BaseModel):
    id: int
    user_id: int
    emergency_type: str
    severity: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    incidents: List[IncidentOut] = []

    class Config:
        from_attributes = True

class EmergencyResolveRequest(BaseModel):
    resolution_notes: Optional[str] = None
