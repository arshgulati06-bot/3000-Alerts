from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, func
from backend.app.core.database import Base


class Alert(Base):
    """
    SQLAlchemy Model for Ingested and Normalized Security Alerts.

    Severity Scale:
        1 - 3: Low Severity (Informational / Reconnaissance)
        4 - 6: Medium Severity (Suspicious Activity / Policy Violation)
        7 - 8: High Severity (Active Exploitation Attempt / Lateral Movement)
        9 - 10: Critical Severity (Confirmed Breach / Data Exfiltration)
    """

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    external_alert_id = Column(String(255), unique=True, index=True, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    source_ip = Column(String(45), nullable=True, index=True)
    destination_ip = Column(String(45), nullable=True, index=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    protocol = Column(String(20), nullable=True)
    event_type = Column(String(100), nullable=False, index=True)
    severity = Column(Integer, nullable=False)
    asset_id = Column(String(100), nullable=True, index=True)
    user = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    raw_data = Column(JSON, nullable=False, default=dict)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<Alert(id={self.id}, external_id='{self.external_alert_id}', "
            f"type='{self.event_type}', severity={self.severity})>"
        )
