from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    emergency_id = Column(Integer, ForeignKey("emergencies.id", ondelete="CASCADE"), nullable=False, index=True)
    ai_analysis = Column(Text, nullable=False)
    detected_keywords = Column(String(255), nullable=True)
    recommended_action = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    emergency = relationship("Emergency", back_populates="incidents")
