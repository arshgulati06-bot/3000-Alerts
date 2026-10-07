from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class InvestigationBase(BaseModel):
    """Base Pydantic schema for AI-assisted incident investigations."""

    incident_id: int = Field(..., description="Foreign key referencing associated incident")
    summary: Optional[str] = Field(
        None,
        description="Evidence-grounded executive investigation summary",
    )
    evidence: Optional[list[Any] | dict[str, Any]] = Field(
        default_factory=list,
        description="Structured key evidence points extracted from correlated alerts",
    )
    attack_path: Optional[list[Any] | dict[str, Any]] = Field(
        default_factory=list,
        description="Reconstructed chronological attack timeline / path",
    )
    recommendations: Optional[list[Any] | dict[str, Any]] = Field(
        default_factory=list,
        description="Actionable containment and remediation steps for the analyst",
    )


class InvestigationCreate(InvestigationBase):
    """Schema for storing generated investigation reports (Phase 4)."""
    pass


class InvestigationResponse(InvestigationBase):
    """Schema for returning investigation reports."""

    id: int = Field(..., description="Unique database identifier for the investigation")
    generated_at: datetime = Field(..., description="Timestamp when summary was generated")

    model_config = ConfigDict(from_attributes=True)
