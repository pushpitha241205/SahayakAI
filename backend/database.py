import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.config import settings

logger = logging.getLogger(__name__)

# Check database connection string
database_url = settings.DATABASE_URL

# Fallback mechanism: If MySQL is unavailable during local development, fall back gracefully
try:
    if database_url.startswith("sqlite"):
        engine = create_engine(
            database_url, connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=3600
        )
        # Test connection
        with engine.connect() as conn:
            pass
except Exception as e:
    logger.warning(f"Failed to connect to MySQL with {database_url}: {e}")
    logger.info("Falling back to local SQLite database (sqlite:///./sahayak_ai.db) for reliable runtime...")
    database_url = "sqlite:///./sahayak_ai.db"
    engine = create_engine(
        database_url, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
