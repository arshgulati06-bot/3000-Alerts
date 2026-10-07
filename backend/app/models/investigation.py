from sqlalchemy import Column, Integer, Text, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Investigation(Base):
    """
    SQLAlchemy Model for AI-Assisted Incident Investigation Summaries.

    In Phase 1, no AI content is generated. This table stores future Azure OpenAI
    evidence-grounded investigation reports, attack paths, and recommendations.
    """

    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    incident_id = Column(
        Integer,
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    summary = Column(Text, nullable=True)
    evidence = Column(JSON, nullable=True, default=list)
    attack_path = Column(JSON, nullable=True, default=list)
    recommendations = Column(JSON, nullable=True, default=list)
    generated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    incident = relationship("Incident", back_populates="investigations")

    def __repr__(self) -> str:
        return f"<Investigation(id={self.id}, incident_id={self.incident_id})>"
