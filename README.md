# Sworders SOC — AI-Powered Security Operations Center

> **Microsoft Innovate 2026 Round 2 Hackathon Project**  
> **Problem Statement:** *"3,000 Alerts, One Analyst"*

---

## 🎯 Project Overview

Security Operations Centers (SOCs) are overwhelmed. A single tier-1 security analyst frequently faces **3,000+ alerts daily**, leading to alert fatigue, missed zero-day threats, and delayed incident containment.

**Sworders SOC** transforms this reality. By ingesting high-throughput heterogeneous security telemetry, normalizing it into a unified schema, correlating related alerts into unified incidents, calculating an explainable risk score, mapping tactics to the **MITRE ATT&CK** framework, and leveraging **Azure OpenAI**, Sworders SOC provides analysts with automated, evidence-grounded incident summaries and rapid remediation pathways.

---

## 📌 CURRENT SCOPE (Hackathon Demo Build)

**Working end to end:**
- ✅ FastAPI backend (Pydantic v2, SQLAlchemy 2.x) — alerts, incidents, investigations, users
- ✅ Demo authentication — sign in / create account / session restore / sign out (`/api/auth/*`)
- ✅ Alert ingestion (`POST /api/alerts`) and querying (`GET /api/alerts`)
- ✅ Incidents with persisted workflow: NEW → INVESTIGATING → CONTAINED → RESOLVED (`PATCH /api/incidents/{id}`, sign-in required)
- ✅ React + Vite SOC console: Dashboard, Alert Queue, Incidents, Investigation Workspace, MITRE ATT&CK coverage, System Status
- ✅ Explainable, rule-based investigation analysis and MITRE ATT&CK mapping (in the frontend, `src/data/socKnowledge.js`)
- ✅ PostgreSQL with automatic SQLite fallback + automatic simulated demo data
- ✅ Pytest suite (16 tests) and a passing production frontend build

**Simulated / not yet implemented (be explicit in the demo):**
- ⚠️ All alerts, hosts, IPs and incidents are **simulated** demo data.
- ⚠️ Incident correlation is pre-computed in the seed data (no live correlation engine yet).
- ⚠️ Recommended response actions (isolate host, revoke sessions, block IP…) are a **checklist only** — nothing is executed against real systems.
- ⚠️ No external AI model is called. The "AI-assisted" panel is labelled *Explainable · rule-based*; Azure OpenAI is a reserved integration point.
- ⚠️ Mean Time to Respond on the dashboard is a labelled demo baseline, not a measurement.

---

## 🚀 Run the Demo (Mentor Evaluation)

**Prerequisites:** Python 3.11+ and Node.js 18+. PostgreSQL is optional.

```bash
# 1. Backend (FastAPI) — from the repo root
pip install -r backend/requirements.txt
python backend/run.py                 # http://localhost:8000   Swagger UI: http://localhost:8000/docs

# 2. Frontend (React + Vite) — second terminal
cd frontend && npm install && npm run dev   # http://localhost:3000  (proxies /api → :8000)

# Tests
python -m pytest                      # backend (from repo root)
cd frontend && npm run build          # frontend production build
```

**Demo sign-in:** `analyst@sworders.demo` / `SwordersDemo2026` (created automatically on first start; override with
`DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`). You can also use **Create account**.

**Database / demo mode (no setup required):**
- If PostgreSQL (`DATABASE_URL`) is unreachable, the API automatically uses a local SQLite file `sworders_demo.db`;
  `/api/health` and the System Status page then show **DEMO MODE (SQLite fallback)**. Disable with `DEMO_DB_FALLBACK=false`.
- An empty database is seeded with clearly simulated alerts, incidents and investigations, shifted so the scenario falls
  in the last 24 hours. Disable with `SEED_DEMO_DATA=false`.
- **Reset the demo:** stop the backend, delete `sworders_demo.db`, start it again.
- If the backend is down, the login page offers **Continue in offline demo mode**; every view then shows **DEMO DATA**
  and status changes are not saved.
- Sessions are signed with `SECRET_KEY`. If it is not set, a random key is generated at startup, so restarting the
  backend signs everyone out.

**Demo flow:** Sign in → Dashboard → Alert Queue → *Investigate* on critical alert `ALT-98211` → Investigation Workspace
(overview, attack timeline, evidence, related alerts, risk score, affected systems, MITRE ATT&CK, explainable analysis,
recommended response) → **Mark Investigating → Mark Contained → Resolve Incident** (saved to the database, survives page
refresh) → MITRE ATT&CK → System Status → Sign out.

---

## 🏗️ System Architecture

```
Security Alerts Telemetry (SIEM, EDR, Cloud, Auth)
                     ↓
       [Phase 1] Alert Ingestion (FastAPI)               <-- IMPLEMENTED
                     ↓
       [Phase 1] Alert Normalization & DB (PostgreSQL)   <-- IMPLEMENTED
                     ↓
       [Phase 2] Alert Correlation Engine                <-- FUTURE (Dev A)
                     ↓
       [Phase 2] Incident Formation                      <-- FUTURE (Dev A)
                     ↓
       [Phase 3] Explainable Risk Scoring                <-- FUTURE (Dev B)
                     ↓
       [Phase 3] MITRE ATT&CK Mapping                    <-- FUTURE (Dev B)
                     ↓
       [Phase 4] Azure OpenAI Investigation Summary       <-- FUTURE (Dev C)
                     ↓
       [Phase 5] React SOC Analyst Dashboard             <-- FUTURE (Dev D)
```

For complete architecture details, see [docs/ARCHITECTURE.md](file:///docs/ARCHITECTURE.md).  
For the frozen endpoint and payload contract, see [docs/API_CONTRACT.md](file:///docs/API_CONTRACT.md).

---

## 💻 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Python 3.11+ (Tested on 3.13) | Core backend programming language |
| **API Framework** | FastAPI | High-performance, async-ready web framework |
| **ASGI Server** | Uvicorn | Production-grade ASGI web server |
| **Data Validation** | Pydantic v2 | Strict schema validation and serialization |
| **ORM** | SQLAlchemy 2.x | Database modeling and transactional sessions |
| **Database Driver** | psycopg2-binary | PostgreSQL connection adapter |
| **Configuration** | python-dotenv & pydantic-settings | Environment variable management |
| **Test Suite** | Pytest + Starlette/FastAPI TestClient | Unit and integration testing |

---

## 📁 Repository Structure

```
sworders-soc/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application entrypoint & error handlers
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py            # Pydantic BaseSettings & env loader
│   │   │   └── database.py          # SQLAlchemy engine, session maker, get_db()
│   │   │
│   │   ├── models/                  # SQLAlchemy 2.x ORM Database Models
│   │   │   ├── __init__.py
│   │   │   ├── alert.py             # Alert ORM model
│   │   │   ├── incident.py          # Incident ORM model
│   │   │   └── investigation.py     # Investigation ORM model
│   │   │
│   │   ├── schemas/                 # Pydantic Schemas for Validation
│   │   │   ├── __init__.py
│   │   │   ├── alert.py             # AlertCreate, AlertResponse, AlertListResponse
│   │   │   ├── incident.py          # IncidentCreate, IncidentResponse, IncidentDetailResponse
│   │   │   └── investigation.py     # InvestigationBase, InvestigationResponse
│   │   │
│   │   ├── routes/                  # API Endpoint Controllers
│   │   │   ├── __init__.py
│   │   │   ├── health.py            # GET /api/health
│   │   │   ├── alerts.py            # POST /api/alerts, GET /api/alerts
│   │   │   └── incidents.py         # GET /api/incidents, GET /api/incidents/{id}
│   │   │
│   │   └── services/                # Future Downstream Pipeline Modules
│   │       ├── __init__.py
│   │       └── README.md            # Integration guide for Devs A, B, C
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_api.py              # Automated test suite
│   │
│   ├── requirements.txt
│   ├── .env.example
│   ├── .gitignore
│   └── run.py                       # Server runner: `python backend/run.py`
│
├── data/
│   └── README.md                    # Sample alert telemetry guide
│
├── docs/
│   ├── ARCHITECTURE.md              # Full system architecture
│   └── API_CONTRACT.md              # Complete REST API specification
│
├── pytest.ini
├── README.md
└── .gitignore
```

---

## ⚙️ Local Setup & Installation

### 1. Prerequisites
- Python 3.11 or higher
- PostgreSQL (or SQLite for lightweight local testing)
- Git

### 2. Clone & Virtual Environment Setup
```bash
# Clone the repository
git clone https://github.com/your-org/sworders-soc.git
cd sworders-soc

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Upgrade pip & install dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` to configure your PostgreSQL credentials:
```env
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/sworders_soc

# Application Settings
APP_NAME=Sworders SOC API
APP_ENV=development
API_PREFIX=/api

# Azure OpenAI (Reserved for Phase 4)
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=
```

---

## 🗄️ Database Setup

### Step 1: Create the PostgreSQL Database
```sql
CREATE DATABASE sworders_soc;
```

### Step 2: Automatic Table Initialization
Tables are verified and safely created on FastAPI startup via `Base.metadata.create_all(bind=engine)`.  
No existing tables or rows are ever dropped or truncated.

---

## 🚀 Running the Application

### Option A: Using the Runner Script
```bash
python backend/run.py
```

### Option B: Using Uvicorn Directly
```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

### Interactive API Documentation
Once running, navigate to:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service & DB connectivity health check | `200` / `503` |
| `POST` | `/api/alerts` | Ingest normalized security alert | `201` / `400` / `409` |
| `GET` | `/api/alerts` | List alerts with pagination & filtering | `200` |
| `GET` | `/api/incidents` | List correlated incidents | `200` |
| `GET` | `/api/incidents/{id}` | Get incident details & investigation | `200` / `404` |
| `PATCH` | `/api/incidents/{id}` | Change workflow status (bearer token required) | `200` / `401` / `404` / `422` |
| `POST` | `/api/auth/login` | Sign in, returns bearer token | `200` / `401` / `422` |
| `POST` | `/api/auth/register` | Create analyst account, returns bearer token | `201` / `409` / `422` |
| `GET` | `/api/auth/me` | Current analyst for a bearer token | `200` / `401` |

---

## 🧪 Running Automated Tests

Run the test suite with `pytest`:
```bash
pytest
```

---

## 🛡️ Security & GitHub Safety

- All `.env` files, `.venv`, virtual environments, and caches are ignored by Git.
- No database credentials, API keys, or secrets are tracked.
- Global exception handlers sanitize server errors (HTTP 500) to prevent tracebacks or internal config exposure.

---

## 👥 Future Developer Integration (Phases 2 – 5)

| Developer Role | Assigned Module | Integration Point |
| :--- | :--- | :--- |
| **Developer A** | Correlation Engine | `backend/app/services/correlation_service.py` |
| **Developer B** | Risk Scoring & MITRE ATT&CK | `backend/app/services/risk_service.py`, `mitre_service.py` |
| **Developer C** | Azure OpenAI Investigation | `backend/app/services/ai_service.py` |
| **Developer D** | React Analyst Dashboard | `frontend/` (React + TypeScript) |
