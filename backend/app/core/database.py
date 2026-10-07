import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


def _make_engine(url: str):
    """Configure engine arguments based on database dialect."""
    engine_kwargs = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    elif url.startswith("postgresql"):
        engine_kwargs["connect_args"] = {"connect_timeout": 3}
    return create_engine(url, **engine_kwargs)


def _resolve_engine():
    """
    Connect to the configured database. If it is unreachable and the demo
    fallback is enabled, use a local SQLite file so the demo never blocks.
    Returns (engine, mode) where mode is 'primary' or 'demo-fallback'.
    """
    primary = _make_engine(settings.DATABASE_URL)
    if settings.DATABASE_URL.startswith("sqlite") or not settings.DEMO_DB_FALLBACK:
        return primary, "primary"
    try:
        with primary.connect() as connection:
            connection.execute(text("SELECT 1"))
        return primary, "primary"
    except Exception as exc:  # noqa: BLE001 - any connect failure triggers fallback
        logger.warning(
            "Primary database unreachable (%s). Falling back to demo SQLite database.",
            exc.__class__.__name__,
        )
        return _make_engine(settings.DEMO_FALLBACK_URL), "demo-fallback"


engine, DB_MODE = _resolve_engine()
DB_DIALECT = engine.dialect.name

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
