import logging
from sqlalchemy.orm import Session
from backend.models.user import User
from backend.utils.auth import hash_password

logger = logging.getLogger(__name__)

def seed_default_admin(db: Session):
    try:
        admin_email = "admin@sahayak.ai"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            logger.info("Seeding default administrator account...")
            admin = User(
                name="Sahayak Admin",
                email=admin_email,
                phone="1800-SAHAYAK",
                password_hash=hash_password("Admin@12345"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            logger.info("Default administrator account created: admin@sahayak.ai / Admin@12345")
    except Exception as e:
        logger.warning(f"Could not auto-seed admin: {e}")
