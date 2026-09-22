from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship as sa_relationship
from backend.database import Base

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    relationship_type = Column("relationship", String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Allow accessing both as .relationship and .relationship_type
    @property
    def relationship(self):
        return self.relationship_type

    @relationship.setter
    def relationship(self, value):
        self.relationship_type = value

    # Relationships
    user = sa_relationship("User", back_populates="contacts")
