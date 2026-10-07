import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.incident import Incident
from backend.app.schemas.incident import IncidentDetailResponse, IncidentListResponse

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get(
    "",
    response_model=IncidentListResponse,
    summary="List Security Incidents",
    description=(
        "Retrieves a paginated list of correlated security incidents. "
        "In Phase 1, this returns an empty list or manual incidents until correlation engine (Phase 2) is active."
    ),
    responses={
        200: {"description": "Paginated list of incidents returned successfully."},
    },
)
def list_incidents(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(50, ge=1, le=500, description="Number of incidents per page"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by incident status (e.g., 'open', 'resolved')"),
    priority_filter: Optional[str] = Query(None, alias="priority", description="Filter by priority (e.g., 'high', 'critical')"),
    db: Session = Depends(get_db),
) -> IncidentListResponse:
    """Retrieve security incidents with pagination and filtering."""
    query = db.query(Incident)

    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if priority_filter:
        query = query.filter(Incident.priority == priority_filter)

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    offset = (page - 1) * page_size

    items = (
        query.order_by(Incident.created_at.desc(), Incident.id.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return IncidentListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{incident_id}",
    response_model=IncidentDetailResponse,
    summary="Get Incident by ID",
    description="Retrieves single security incident details including any associated investigation reports.",
    responses={
        200: {"description": "Incident details returned successfully."},
        404: {"description": "Incident not found."},
    },
)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
) -> Incident:
    """Retrieve details of a specific incident by primary key ID."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found.",
        )
    return incident
