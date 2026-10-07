# Sworders SOC — AI-Powered Security Operations Center

> **Microsoft Innovate 2026 Round 2 Hackathon Project**  
> **Problem Statement:** *"3,000 Alerts, One Analyst"*

---

## 🎯 Project Overview

Security Operations Centers (SOCs) are overwhelmed. A single tier-1 security analyst frequently faces **3,000+ alerts daily**, leading to alert fatigue, missed zero-day threats, and delayed incident containment.

**Sworders SOC** transforms this reality. By ingesting high-throughput heterogeneous security telemetry, normalizing it into a unified schema, correlating related alerts into unified incidents, calculating an explainable risk score, mapping tactics to the **MITRE ATT&CK** framework, and leveraging **Azure OpenAI**, Sworders SOC provides analysts with automated, evidence-grounded incident summaries and rapid remediation pathways.

---

## 📌 CURRENT SCOPE

> [!IMPORTANT]
> **This repository is currently at Phase 1: Backend Foundation.**
>
> In accordance with Hackathon Phase 1 requirements:
> - ✅ REST API Architecture (FastAPI + Pydantic v2 + SQLAlchemy 2.x)
> - ✅ Core Database Models (`alerts`, `incidents`, `investigations`)
> - ✅ Alert Ingestion (`POST /api/alerts`) & Querying (`GET /api/alerts`)
> - ✅ Incident Retrieval (`GET /api/incidents`, `GET /api/incidents/{id}`)
> - ✅ Health Check Endpoint with Graceful Database Error Handling (`GET /api/health`)
> - ✅ Complete Pydantic Validation & Sanitized Error Responses
> - ✅ Interactive Swagger API Documentation (`/docs`)
> - ✅ Unit & Integration Test Suite (`pytest`)
>
> **Explicitly NOT Implemented Yet (Reserved for Subsequent Phases):**
> - ❌ Correlation engine heuristics (`services/correlation_service.py` — Phase 2)
> - ❌ Explainable risk scoring calculations (`services/risk_service.py` — Phase 3)
> - ❌ MITRE ATT&CK taxonomy mapper (`services/mitre_service.py` — Phase 3)
> - ❌ Azure OpenAI LLM summarization (`services/ai_service.py` — Phase 4)
> - ❌ React SOC Dashboard UI (`frontend/` — Phase 5)

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
