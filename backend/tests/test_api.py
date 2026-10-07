import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.core.database import Base, get_db
from backend.app.main import app
from backend.app.models.alert import Alert
from backend.app.models.incident import Incident

# Setup in-memory SQLite for deterministic, isolated unit and integration testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Dependency override providing isolated SQLite test session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_test_db():
    """Create fresh database tables before each test and drop them after."""
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    """FastAPI TestClient instance."""
    with TestClient(app) as test_client:
        yield test_client


# ==============================================================================
# 1. Health Check Tests
# ==============================================================================
def test_health_check_connected(client):
    """Test GET /api/health when database is accessible."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


def test_health_check_database_disconnected(client):
    """Test GET /api/health returns 503 degraded when DB is down."""
    def broken_get_db():
        class MockFailingSession:
            def execute(self, query):
                raise ConnectionError("Simulated database failure")
            def close(self):
                pass
        yield MockFailingSession()

    app.dependency_overrides[get_db] = broken_get_db
    response = client.get("/api/health")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "degraded"
    assert data["database"] == "disconnected"


def test_root_endpoint(client):
    """Test GET / returns project metadata and docs link."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "Sworders SOC"
    assert data["docs_url"] == "/docs"


# ==============================================================================
# 2. Alert Ingestion (POST /api/alerts) Tests
# ==============================================================================
def test_create_alert_valid(client):
    """Test successful ingestion of a valid normalized alert."""
    payload = {
        "external_alert_id": "A-001",
        "timestamp": "2026-09-30T10:01:00Z",
        "source_ip": "10.0.0.5",
        "destination_ip": "10.0.0.10",
        "source_port": 49152,
        "destination_port": 443,
        "protocol": "TCP",
        "event_type": "authentication_failure",
        "severity": 7,
        "asset_id": "SERVER-01",
        "user": "user01",
        "description": "Repeated authentication failure",
        "raw_data": {"attempts": 5, "auth_mechanism": "NTLM"},
    }

    response = client.post("/api/alerts", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["external_alert_id"] == "A-001"
    assert data["severity"] == 7
    assert data["event_type"] == "authentication_failure"
    assert data["asset_id"] == "SERVER-01"
    assert data["created_at"] is not None


def test_create_alert_duplicate_external_id(client):
    """Test that duplicate external_alert_id returns HTTP 409 Conflict."""
    payload = {
        "external_alert_id": "A-DUP-01",
        "timestamp": "2026-09-30T10:01:00Z",
        "event_type": "port_scan",
        "severity": 5,
    }

    # First insert
    res1 = client.post("/api/alerts", json=payload)
    assert res1.status_code == 201

    # Duplicate insert
    res2 = client.post("/api/alerts", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]


def test_create_alert_validation_error_severity(client):
    """Test that invalid severity (< 1 or > 10) returns HTTP 422 Validation Error."""
    payload = {
        "external_alert_id": "A-BAD-01",
        "timestamp": "2026-09-30T10:01:00Z",
        "event_type": "port_scan",
        "severity": 15,  # Invalid: max is 10
    }

    response = client.post("/api/alerts", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["error"] == "Validation Error"


def test_create_alert_validation_error_missing_required(client):
    """Test that missing required fields (event_type or timestamp) returns HTTP 422."""
    payload = {
        "source_ip": "10.0.0.5",
        "severity": 3,
        # Missing required timestamp and event_type
    }

    response = client.post("/api/alerts", json=payload)
    assert response.status_code == 422


# ==============================================================================
# 3. Alert Listing (GET /api/alerts) Tests
# ==============================================================================
def test_list_alerts_empty(client):
    """Test GET /api/alerts when no alerts exist."""
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1


def test_list_alerts_with_data_and_filtering(client):
    """Test retrieving and filtering alerts."""
    # Insert two alerts
    alert1 = {
        "external_alert_id": "A-FILTER-1",
        "timestamp": "2026-09-30T10:01:00Z",
        "event_type": "brute_force",
        "severity": 8,
        "asset_id": "SERVER-01",
    }
    alert2 = {
        "external_alert_id": "A-FILTER-2",
        "timestamp": "2026-09-30T10:05:00Z",
        "event_type": "port_scan",
        "severity": 3,
        "asset_id": "FIREWALL-01",
    }

    client.post("/api/alerts", json=alert1)
    client.post("/api/alerts", json=alert2)

    # Fetch all
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    # Filter by severity
    res_sev = client.get("/api/alerts?severity=8")
    assert res_sev.status_code == 200
    data_sev = res_sev.json()
    assert data_sev["total"] == 1
    assert data_sev["items"][0]["external_alert_id"] == "A-FILTER-1"

    # Filter by event_type
    res_type = client.get("/api/alerts?event_type=port_scan")
    assert res_type.status_code == 200
    data_type = res_type.json()
    assert data_type["total"] == 1
    assert data_type["items"][0]["external_alert_id"] == "A-FILTER-2"


# ==============================================================================
# 4. Incident Tests (GET /api/incidents & GET /api/incidents/{id})
# ==============================================================================
def test_list_incidents_empty_phase1(client):
    """Test GET /api/incidents returns empty list in Phase 1 before correlation."""
    response = client.get("/api/incidents")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_get_incident_not_found(client):
    """Test GET /api/incidents/{id} with nonexistent ID returns HTTP 404."""
    response = client.get("/api/incidents/99999")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_get_incident_found(client):
    """Test GET /api/incidents/{id} when incident exists in DB."""
    db = TestingSessionLocal()
    incident = Incident(
        incident_key="INC-TEST-001",
        status="open",
        asset_id="SERVER-01",
        risk_score=75.0,
        priority="high",
        mitre_tactic="TA0001",
        mitre_technique="T1078",
        summary="Test incident for endpoint verification",
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    inc_id = incident.id
    db.close()

    response = client.get(f"/api/incidents/{inc_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == inc_id
    assert data["incident_key"] == "INC-TEST-001"
    assert data["risk_score"] == 75.0
    assert data["priority"] == "high"
    assert data["investigations"] == []


# ==============================================================================
# Demo build additions: status workflow + demo seeding
# ==============================================================================
def test_update_incident_status(client):
    """PATCH /api/incidents/{id} transitions the workflow status."""
    db = TestingSessionLocal()
    db.add(Incident(incident_key="INC-PATCH-1", status="open"))
    db.commit()
    incident_id = db.query(Incident).first().id
    db.close()

    # Workflow changes require an authenticated analyst
    assert client.patch(f"/api/incidents/{incident_id}", json={"status": "contained"}).status_code == 401

    token = client.post(
        "/api/auth/register",
        json={"email": "patch@test.local", "password": "longpassword", "full_name": "Patch Tester"},
    ).json()["access_token"]
    auth = {"Authorization": f"Bearer {token}"}

    response = client.patch(f"/api/incidents/{incident_id}", json={"status": "contained"}, headers=auth)
    assert response.status_code == 200
    assert response.json()["status"] == "contained"

    assert client.patch(f"/api/incidents/{incident_id}", json={"status": "bogus"}, headers=auth).status_code == 422
    assert client.patch("/api/incidents/9999", json={"status": "resolved"}, headers=auth).status_code == 404


def test_demo_seed_populates_empty_database():
    """Demo seeding fills an empty DB once and never duplicates."""
    from backend.app.services.demo_seed import seed_demo_data

    db = TestingSessionLocal()
    assert seed_demo_data(db) is True
    assert db.query(Incident).count() == 6
    assert db.query(Alert).count() > 100
    assert seed_demo_data(db) is False
    db.close()


def test_auth_register_login_me_flow(client):
    """Register → duplicate rejected → bad password rejected → login → /me."""
    payload = {"email": "Analyst@Test.local", "password": "correct-horse", "full_name": "Test Analyst"}
    created = client.post("/api/auth/register", json=payload)
    assert created.status_code == 201
    assert created.json()["user"]["email"] == "analyst@test.local"
    assert "password" not in created.text and "password_hash" not in created.text

    assert client.post("/api/auth/register", json=payload).status_code == 409
    assert client.post("/api/auth/register", json={**payload, "email": "x@y.z", "password": "short"}).status_code == 422
    assert client.post("/api/auth/login", json={"email": "analyst@test.local", "password": "wrong"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "not-an-email", "password": "x"}).status_code == 422

    login = client.post("/api/auth/login", json={"email": "analyst@test.local", "password": "correct-horse"})
    assert login.status_code == 200
    token = login.json()["access_token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200 and me.json()["full_name"] == "Test Analyst"
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}x"}).status_code == 401


def test_demo_user_created_once():
    from backend.app.services.demo_seed import ensure_demo_user

    db = TestingSessionLocal()
    assert ensure_demo_user(db) is True
    assert ensure_demo_user(db) is False
    db.close()
