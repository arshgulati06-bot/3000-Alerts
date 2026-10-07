import logging
from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from backend.app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    """Health status response payload."""

    status: str = Field(
        ...,
        description="Overall service status ('ok' or 'degraded')",
        examples=["ok"],
    )
    database: str = Field(
        ...,
        description="Database connectivity status ('connected' or 'disconnected')",
        examples=["connected"],
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System and Database Health Check",
    description="Returns the operational status of the Sworders SOC API and its database connection.",
    responses={
        200: {"description": "Service is healthy and database is connected"},
        503: {"description": "Service is degraded due to database unavailability"},
    },
)
def health_check(
    response: Response,
    db: Session = Depends(get_db),
) -> HealthResponse:
    """Check API and database health."""
    try:
        db.execute(text("SELECT 1"))
        response.status_code = status.HTTP_200_OK
        return HealthResponse(status="ok", database="connected")
    except Exception as exc:
        logger.warning("Database health check ping failed: %s", str(exc))
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(status="degraded", database="disconnected")
