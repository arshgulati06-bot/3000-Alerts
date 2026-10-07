import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Configure engine arguments based on database dialect
engine_kwargs = {"pool_pre_ping": True}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session per request.
    Ensures proper cleanup and rollback if an unhandled exception occurs.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Safe database initialization for prototype/development.
    Creates all defined tables if they do not already exist.
    Will NEVER drop, truncate, or alter existing tables/data.
    """
    try:
        # Import models so Base.metadata knows about all tables
        import backend.app.models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as exc:
        logger.warning(
            "Database table creation check failed (database may be offline during startup): %s",
            str(exc),
        )


def check_db_health() -> tuple[bool, str]:
    """
    Lightweight health check against the database.
    Executes 'SELECT 1' to verify connectivity.
    Returns (is_connected: bool, status_message: str).
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, "connected"
    except (OperationalError, SQLAlchemyError) as exc:
        logger.error("Database connection check failed: %s", str(exc))
        return False, "disconnected"
    except Exception as exc:
        logger.error("Unexpected error during database check: %s", str(exc))
        return False, "unavailable"
