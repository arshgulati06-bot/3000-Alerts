"""
Demo data seeding for mentor demonstrations and local development.

Populates an EMPTY database with clearly simulated SOC telemetry so the dashboard
never looks empty. All hosts, IPs and accounts are fictional (private /
documentation ranges). Existing data is never modified or deleted.
"""

import json
import logging
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from backend.app.models.alert import Alert
from backend.app.models.incident import Incident
from backend.app.models.investigation import Investigation
from backend.app.models.user import User
from backend.app.core.config import settings
from backend.app.core.security import hash_password

logger = logging.getLogger(__name__)

DEMO_DATA_PATH = Path(__file__).with_name("demo_data.json")

# Background "noise" alerts that the correlation story reduces to a few incidents.
_NOISE_TEMPLATES = [
    ("authentication_failure", 3, "Single failed interactive logon"),
    ("port_scan_detected", 4, "Low-rate TCP SYN scan from internal host"),
    ("dns_query_anomaly", 3, "DNS query to newly registered domain"),
    ("policy_violation", 2, "USB mass storage device mounted"),
    ("malware_signature_match", 6, "Adware PUP blocked by endpoint protection"),
    ("impossible_travel", 5, "Sign-in from two distant locations within 1 hour"),
    ("firewall_deny", 1, "Inbound connection denied by perimeter firewall"),
]
_NOISE_ASSETS = ["FINANCE-SRV-01", "HR-LAPTOP-07", "DC-01", "DEV-WKS-14", "WEB-DMZ-03", "MAIL-GW-01"]
_NOISE_USERS = ["svc_backup", "demo.analyst", "hr.user07", "dev.user14", None]


def _parse_ts(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _noise_alerts(anchor: datetime, count: int = 140) -> list[dict]:
    rng = random.Random(3000)  # deterministic demo data
    alerts = []
    for idx in range(count):
        event_type, severity, description = rng.choice(_NOISE_TEMPLATES)
        alerts.append(
            {
                "external_alert_id": f"DEMO-N{idx:04d}",
                "timestamp": anchor - timedelta(minutes=rng.randint(30, 24 * 60)),
                "source_ip": f"10.20.{rng.randint(1, 9)}.{rng.randint(2, 250)}",
                "destination_ip": f"10.0.0.{rng.randint(2, 60)}",
                "source_port": rng.randint(1024, 65535),
                "destination_port": rng.choice([22, 53, 80, 443, 445, 3389]),
                "protocol": rng.choice(["TCP", "UDP"]),
                "event_type": event_type,
                "severity": max(1, min(10, severity + rng.choice([-1, 0, 0, 1]))),
                "asset_id": rng.choice(_NOISE_ASSETS),
                "user": rng.choice(_NOISE_USERS),
                "description": f"{description} (simulated demo telemetry)",
                "raw_data": {"source": rng.choice(["Defender for Endpoint", "Entra ID", "Azure Firewall", "Sentinel"]), "simulated": True},
            }
        )
    return alerts


def seed_demo_data(db: Session) -> bool:
    """Seed simulated alerts, incidents and investigations if no incidents exist.

    Returns True when data was inserted.
    """
    if db.query(Incident).count() > 0:
        return False

    data = json.loads(DEMO_DATA_PATH.read_text(encoding="utf-8"))
    existing_ids = {row[0] for row in db.query(Alert.external_alert_id).all()}

    alert_rows = []
    for raw in data["alerts"]:
        payload = {k: v for k, v in raw.items() if k != "id"}
        payload["timestamp"] = _parse_ts(payload["timestamp"])
        payload["raw_data"] = {**(payload.get("raw_data") or {}), "simulated": True}
        alert_rows.append(payload)

    # Shift the scenario by whole days so it always falls within the last 24h
    # (times of day stay identical to the scripted attack timeline).
    now = datetime.now(timezone.utc)
    latest = max(a["timestamp"] for a in alert_rows) if alert_rows else now
    shift = timedelta(days=max(0, (now - latest) // timedelta(days=1)))
    for payload in alert_rows:
        payload["timestamp"] += shift
    anchor = latest + shift
    alert_rows.extend(_noise_alerts(anchor))

    for payload in alert_rows:
        if payload["external_alert_id"] in existing_ids:
            continue
        db.add(Alert(**payload))

    for raw in data["incidents"]:
        investigation = raw.pop("investigation", None)
        raw["created_at"] = _parse_ts(raw["created_at"]) + shift
        raw["updated_at"] = _parse_ts(raw["updated_at"]) + shift
        incident = Incident(**raw)
        if investigation and investigation.get("summary"):
            incident.investigations.append(Investigation(**investigation))
        db.add(incident)

    db.commit()
    logger.info("Seeded demo dataset: %d alerts, %d incidents (simulated).", len(alert_rows), len(data["incidents"]))
    return True


def ensure_demo_user(db: Session) -> bool:
    """Create the documented demo analyst account if no users exist."""
    if db.query(User).count() > 0:
        return False
    db.add(
        User(
            email=settings.DEMO_USER_EMAIL,
            full_name="Demo Analyst",
            role="Tier-2 SOC Analyst",
            password_hash=hash_password(settings.DEMO_USER_PASSWORD),
        )
    )
    db.commit()
    logger.info("Created demo analyst account %s.", settings.DEMO_USER_EMAIL)
    return True
