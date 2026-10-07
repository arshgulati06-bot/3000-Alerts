from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class AlertBase(BaseModel):
    """Base Pydantic schema for normalized security alerts."""

    external_alert_id: Optional[str] = Field(
        None,
        max_length=255,
        description="Unique identifier from upstream SIEM or sensor (e.g., 'A-001')",
        examples=["A-001"],
    )
    timestamp: datetime = Field(
        ...,
        description="Event occurrence timestamp in ISO 8601 format",
        examples=["2026-09-30T10:01:00Z"],
    )
    source_ip: Optional[str] = Field(
        None,
        max_length=45,
        description="Source IPv4 or IPv6 address",
        examples=["10.0.0.5"],
    )
    destination_ip: Optional[str] = Field(
        None,
        max_length=45,
        description="Destination IPv4 or IPv6 address",
        examples=["10.0.0.10"],
    )
    source_port: Optional[int] = Field(
        None,
        ge=0,
        le=65535,
        description="Source port number (0-65535)",
        examples=[49152],
    )
    destination_port: Optional[int] = Field(
        None,
        ge=0,
        le=65535,
        description="Destination port number (0-65535)",
        examples=[443],
    )
    protocol: Optional[str] = Field(
        None,
        max_length=20,
        description="Network protocol (e.g., 'TCP', 'UDP', 'ICMP', 'HTTP')",
        examples=["TCP"],
    )
    event_type: str = Field(
        ...,
        max_length=100,
        description="Normalized category/type of the security event",
        examples=["authentication_failure"],
    )
    severity: int = Field(
        ...,
        ge=1,
        le=10,
        description="Severity score on a 1-10 scale (1=Low, 10=Critical)",
        examples=[7],
    )
    asset_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Identifier for target device, hostname, or workload",
        examples=["SERVER-01"],
    )
    user: Optional[str] = Field(
        None,
        max_length=100,
        description="Username or principal associated with event",
        examples=["user01"],
    )
    description: Optional[str] = Field(
        None,
        description="Human-readable description of the security alert",
        examples=["Repeated authentication failure"],
    )
    raw_data: Optional[dict[str, Any]] = Field(
        default_factory=dict,
        description="Raw telemetry payload from the original data source",
        examples=[{}],
    )


class AlertCreate(AlertBase):
    """Schema for creating/ingesting a normalized alert."""
    pass


class AlertResponse(AlertBase):
    """Schema for returning a persisted normalized alert."""

    id: int = Field(..., description="Unique database primary key identifier")
    created_at: datetime = Field(..., description="Timestamp when the alert was ingested into Sworders SOC")

    model_config = ConfigDict(from_attributes=True)


class AlertListResponse(BaseModel):
    """Paginated list of normalized alerts."""

    items: list[AlertResponse] = Field(..., description="List of alert records")
    total: int = Field(..., description="Total matching records count")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total available pages")
