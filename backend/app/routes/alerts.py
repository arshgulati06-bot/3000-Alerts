import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.alert import Alert
from backend.app.schemas.alert import AlertCreate, AlertResponse, AlertListResponse

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.post(
    "",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Normalized Alert",
    description="Ingests a single normalized security alert into the system for downstream correlation and analysis.",
    responses={
        201: {"description": "Alert successfully ingested and persisted."},
        400: {"description": "Invalid input payload format or constraints violated."},
        409: {"description": "Duplicate external_alert_id detected."},
        500: {"description": "Internal database error during persistence."},
    },
)
def create_alert(
    alert_in: AlertCreate,
    db: Session = Depends(get_db),
) -> Alert:
    """Ingest a normalized alert."""
    # Check for duplicate external_alert_id if specified
    if alert_in.external_alert_id:
        existing_alert = (
            db.query(Alert)
            .filter(Alert.external_alert_id == alert_in.external_alert_id)
            .first()
        )
        if existing_alert:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Alert with external_alert_id '{alert_in.external_alert_id}' already exists.",
            )

    alert = Alert(**alert_in.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get(
    "",
    response_model=AlertListResponse,
    summary="List Normalized Alerts",
    description="Retrieves a paginated list of normalized security alerts with optional filtering.",
    responses={
        200: {"description": "Paginated list of alerts returned successfully."},
    },
)
def list_alerts(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(50, ge=1, le=500, description="Number of alerts per page"),
    severity: Optional[int] = Query(None, ge=1, le=10, description="Filter by severity level (1-10)"),
    event_type: Optional[str] = Query(None, max_length=100, description="Filter by event type"),
    asset_id: Optional[str] = Query(None, max_length=100, description="Filter by asset identifier"),
    db: Session = Depends(get_db),
) -> AlertListResponse:
    """Retrieve normalized alerts with pagination and filtering."""
    query = db.query(Alert)

    if severity is not None:
        query = query.filter(Alert.severity == severity)
    if event_type:
        query = query.filter(Alert.event_type == event_type)
    if asset_id:
        query = query.filter(Alert.asset_id == asset_id)

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    offset = (page - 1) * page_size

    items = (
        query.order_by(Alert.timestamp.desc(), Alert.id.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return AlertListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
