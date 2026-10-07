from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from backend.app.schemas.investigation import InvestigationResponse


class IncidentBase(BaseModel):
    """Base Pydantic schema for security incidents."""

    incident_key: str = Field(
        ...,
        max_length=100,
        description="Unique incident identifier (e.g., 'INC-2026-0001')",
        examples=["INC-2026-0001"],
    )
    status: str = Field(
        default="open",
        max_length=50,
        description="Incident workflow status: 'open', 'investigating', 'resolved', 'closed'",
        examples=["open"],
    )
    asset_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Primary impacted asset or device",
        examples=["SERVER-01"],
    )
    risk_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        description="Calculated composite risk score (0.0 to 100.0). Populated in Phase 3.",
        examples=[85.5],
    )
    priority: Optional[str] = Field(
        None,
        max_length=20,
        description="Calculated priority: 'low', 'medium', 'high', 'critical'",
        examples=["high"],
    )
    mitre_tactic: Optional[str] = Field(
        None,
        max_length=100,
        description="Mapped MITRE ATT&CK Tactic name or ID. Populated in Phase 3.",
        examples=["TA0001 - Initial Access"],
    )
    mitre_technique: Optional[str] = Field(
        None,
        max_length=100,
        description="Mapped MITRE ATT&CK Technique ID & Name. Populated in Phase 3.",
        examples=["T1078 - Valid Accounts"],
    )
    summary: Optional[str] = Field(
        None,
        description="High-level incident summary. Populated in Phase 4.",
        examples=["Multiple brute-force attempts followed by unauthorized credential access."],
    )


class IncidentCreate(IncidentBase):
    """Schema for creating an incident (used by Correlation Engine in Phase 2)."""
    pass


class IncidentResponse(IncidentBase):
    """Schema for returning incident summary data."""

    id: int = Field(..., description="Unique database primary key identifier")
    created_at: datetime = Field(..., description="Incident creation timestamp")
    updated_at: datetime = Field(..., description="Incident last updated timestamp")

    model_config = ConfigDict(from_attributes=True)


class IncidentDetailResponse(IncidentResponse):
    """Detailed schema for single incident retrieval including investigations."""

    investigations: list[InvestigationResponse] = Field(
        default_factory=list,
        description="Associated AI investigation reports (Phase 4)",
    )


class IncidentListResponse(BaseModel):
    """Paginated list of security incidents."""

    items: list[IncidentResponse] = Field(..., description="List of incident records")
    total: int = Field(..., description="Total matching records count")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total available pages")
