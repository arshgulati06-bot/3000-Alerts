from sqlalchemy import Column, Integer, String, Text, Float, DateTime, func
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Incident(Base):
    """
    SQLAlchemy Model for Correlated Security Incidents.

    At this stage (Phase 1), incident correlation, risk scoring, MITRE ATT&CK
    mapping, and AI investigation summaries are decoupled. Those fields are
    nullable and will be populated in subsequent phases.
    """

    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    incident_key = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    status = Column(String(50), default="open", nullable=False)
    asset_id = Column(String(100), nullable=True, index=True)
    risk_score = Column(Float, nullable=True)
    priority = Column(String(20), nullable=True)
    mitre_tactic = Column(String(100), nullable=True)
    mitre_technique = Column(String(100), nullable=True)
    summary = Column(Text, nullable=True)

    # Relationships
    investigations = relationship(
        "Investigation",
        back_populates="incident",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<Incident(id={self.id}, key='{self.incident_key}', "
            f"status='{self.status}', priority='{self.priority}')>"
        )
