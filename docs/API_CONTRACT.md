# Sworders SOC — API Contract Specification

**Version:** 1.0.0  
**Phase:** Phase 1 (Backend Foundation)  
**Base URL:** `http://localhost:8000/api`  
**Swagger UI:** `http://localhost:8000/docs`  
**OpenAPI JSON:** `http://localhost:8000/openapi.json`

---

## 1. Data Schemas

### 1.1 Alert Schema (`alerts`)

Stores normalized, ingested security events from heterogeneous upstream telemetry sources (SIEM, EDR, Firewall, IDS/IPS, CloudTrail, etc.).

| Field | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer (Primary Key) | No | Auto-incrementing database ID. |
| `external_alert_id` | String(255) | Yes | Upstream event ID (unique when provided). |
| `timestamp` | ISO 8601 DateTime (UTC) | No | Timestamp of alert occurrence. |
| `source_ip` | String(45) | Yes | Source IPv4 / IPv6 address. |
| `destination_ip` | String(45) | Yes | Destination IPv4 / IPv6 address. |
| `source_port` | Integer | Yes | Source network port (0–65535). |
| `destination_port`| Integer | Yes | Destination network port (0–65535). |
| `protocol` | String(20) | Yes | Network protocol (`TCP`, `UDP`, `ICMP`, etc.). |
| `event_type` | String(100) | No | Standardized category (e.g., `authentication_failure`). |
| `severity` | Integer | No | Standardized severity scale: **1 (Low) to 10 (Critical)**. |
| `asset_id` | String(100) | Yes | Target host, endpoint, or container name. |
| `user` | String(100) | Yes | User account or principal involved in the event. |
| `description` | Text | Yes | Human-readable explanation of the alert. |
| `raw_data` | JSON / JSONB | No | Full raw unparsed payload preserved for audit. |
| `created_at` | ISO 8601 DateTime (UTC) | No | Timestamp when the alert was ingested into the system. |

#### Severity Scale Definition
- **1 – 3 (Low):** Informational telemetry, port scanning, benign policy alerts.
- **4 – 6 (Medium):** Suspicious behavior, anomalous logins, malware detections contained by AV.
- **7 – 8 (High):** Active brute force, lateral movement attempts, privilege escalation indicators.
- **9 – 10 (Critical):** Confirmed ransomware activity, data exfiltration, root compromise.

---

### 1.2 Incident Schema (`incidents`)

Stores security incidents aggregated and correlated from multiple raw alerts.

| Field | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer (Primary Key) | No | Auto-incrementing incident database ID. |
| `incident_key` | String(100) | No | Unique business key (e.g., `INC-2026-0001`). |
| `created_at` | ISO 8601 DateTime (UTC) | No | Timestamp when incident was created. |
| `updated_at` | ISO 8601 DateTime (UTC) | No | Timestamp when incident was last modified. |
| `status` | String(50) | No | Workflow status: `open`, `investigating`, `resolved`, `closed`. |
| `asset_id` | String(100) | Yes | Primary target asset or infrastructure zone. |
| `risk_score` | Float (0.0 – 100.0) | Yes | Explainable composite risk score *(Phase 3)*. |
| `priority` | String(20) | Yes | Operational tier: `low`, `medium`, `high`, `critical` *(Phase 3)*. |
| `mitre_tactic` | String(100) | Yes | MITRE ATT&CK Tactic code & name *(Phase 3)*. |
| `mitre_technique` | String(100) | Yes | MITRE ATT&CK Technique code & name *(Phase 3)*. |
| `summary` | Text | Yes | High-level incident description *(Phase 4)*. |

---

### 1.3 Investigation Schema (`investigations`)

Stores AI-generated evidence, attack path reconstruction, and recommendations.

| Field | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer (Primary Key) | No | Unique investigation ID. |
| `incident_id` | Integer (Foreign Key) | No | Associated `incidents.id` (CASCADE delete). |
| `summary` | Text | Yes | Evidence-grounded executive summary *(Phase 4)*. |
| `evidence` | JSON Array | Yes | Structured key telemetry indicators *(Phase 4)*. |
| `attack_path` | JSON Array | Yes | Chronological attack sequence steps *(Phase 4)*. |
| `recommendations` | JSON Array | Yes | Containment & remediation action items *(Phase 4)*. |
| `generated_at` | ISO 8601 DateTime (UTC) | No | Timestamp when report was generated. |

---

## 2. API Endpoints

### 2.1 Health Check
**`GET /api/health`**

Checks API uptime and database connectivity.

#### Response (200 OK — Database Connected)
```json
{
  "status": "ok",
  "database": "connected"
}
```

#### Response (503 Service Unavailable — Database Disconnected)
```json
{
  "status": "degraded",
  "database": "disconnected"
}
```

---

### 2.2 Ingest Normalized Alert
**`POST /api/alerts`**

Ingests a single normalized security alert into the central store.

#### Request Body
```json
{
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
  "raw_data": {
    "auth_type": "NTLM",
    "failure_reason": "bad_password"
  }
}
```

#### Response (201 Created)
```json
{
  "id": 1,
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
  "raw_data": {
    "auth_type": "NTLM",
    "failure_reason": "bad_password"
  },
  "created_at": "2026-09-30T10:01:05.123456Z"
}
```

#### Error Responses
- **409 Conflict:**
  ```json
  {
    "error": "HTTP Exception",
    "status_code": 409,
    "detail": "Alert with external_alert_id 'A-001' already exists."
  }
  ```
- **422 Unprocessable Entity:**
  ```json
  {
    "error": "Validation Error",
    "message": "The request payload failed schema validation.",
    "details": [
      {
        "field": "body -> severity",
        "message": "Input should be less than or equal to 10"
      }
    ]
  }
  ```

---

### 2.3 List Normalized Alerts
**`GET /api/alerts`**

Retrieves a paginated list of alerts with optional filtering.

#### Query Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | integer | `1` | Page number (1-indexed). |
| `page_size` | integer | `50` | Maximum items per page (max `500`). |
| `severity` | integer | `null` | Filter by exact severity level (1–10). |
| `event_type` | string | `null` | Filter by event type string. |
| `asset_id` | string | `null` | Filter by asset identifier. |

#### Response (200 OK)
```json
{
  "items": [
    {
      "id": 1,
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
      "raw_data": {},
      "created_at": "2026-09-30T10:01:05.123456Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50,
  "total_pages": 1
}
```

---

### 2.4 List Incidents
**`GET /api/incidents`**

Retrieves a paginated list of correlated security incidents.

#### Query Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | integer | `1` | Page number (1-indexed). |
| `page_size` | integer | `50` | Maximum items per page (max `500`). |
| `status` | string | `null` | Filter by status (`open`, `investigating`, `resolved`). |
| `priority` | string | `null` | Filter by priority (`low`, `medium`, `high`, `critical`). |

#### Response (200 OK)
```json
{
  "items": [
    {
      "id": 1,
      "incident_key": "INC-2026-0001",
      "created_at": "2026-09-30T10:05:00Z",
      "updated_at": "2026-09-30T10:05:00Z",
      "status": "open",
      "asset_id": "SERVER-01",
      "risk_score": 85.0,
      "priority": "high",
      "mitre_tactic": "TA0001 - Initial Access",
      "mitre_technique": "T1078 - Valid Accounts",
      "summary": "Brute-force credential access attack detected."
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50,
  "total_pages": 1
}
```

*(Note: In Phase 1, `items` will typically be empty `[]` until correlation engine is connected).*

---

### 2.5 Get Incident by ID
**`GET /api/incidents/{incident_id}`**

Retrieves single incident details including any associated investigation records.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `incident_id` | integer | Yes | Primary key ID of the incident. |

#### Response (200 OK)
```json
{
  "id": 1,
  "incident_key": "INC-2026-0001",
  "created_at": "2026-09-30T10:05:00Z",
  "updated_at": "2026-09-30T10:05:00Z",
  "status": "open",
  "asset_id": "SERVER-01",
  "risk_score": 85.0,
  "priority": "high",
  "mitre_tactic": "TA0001 - Initial Access",
  "mitre_technique": "T1078 - Valid Accounts",
  "summary": "Brute-force credential access attack detected.",
  "investigations": [
    {
      "id": 1,
      "incident_id": 1,
      "summary": "Attacker IP 10.0.0.5 attempted 150 login attempts before gaining access to user01.",
      "evidence": [
        "150 authentication failures on port 443 within 2 minutes",
        "Successful interactive login recorded at 10:04:12Z"
      ],
      "attack_path": [
        "Reconnaissance / Port Scan",
        "Credential Access (Brute Force)",
        "Initial Access Granted"
      ],
      "recommendations": [
        "Isolate host SERVER-01 immediately",
        "Rotate credentials for user01",
        "Block source IP 10.0.0.5 at boundary firewall"
      ],
      "generated_at": "2026-09-30T10:06:00Z"
    }
  ]
}
```

#### Error Response (404 Not Found)
```json
{
  "error": "HTTP Exception",
  "status_code": 404,
  "detail": "Incident with ID 999 not found."
}
```
