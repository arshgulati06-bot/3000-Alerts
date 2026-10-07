# Sworders SOC — Services Architecture Guide

This directory is designated for downstream analytical and intelligence processing pipelines. In **Phase 1 (Foundation)**, business logic is strictly decoupled and route contracts are frozen to allow parallel feature development.

---

## Modular Integration Plan

Future developers can plug in their respective domain logic directly into this folder without modifying the core API routes or database schemas.

```
backend/app/services/
├── __init__.py
├── README.md
├── correlation_service.py     # Developer A (Phase 2: Alert Correlation & Incident Formation)
├── risk_service.py            # Developer B (Phase 3: Explainable Risk Scoring)
├── mitre_service.py           # Developer B (Phase 3: MITRE ATT&CK Mapping)
└── ai_service.py              # Developer C (Phase 4: Azure OpenAI Evidence Summarization)
```

---

## Service Contracts & Responsibilities

### 1. `correlation_service.py` (Developer A — Phase 2)
- **Role:** Ingest normalized alerts, group related alerts by temporal proximity, target asset, IP, or user, and create/update `Incident` records.
- **Input:** `List[Alert]`
- **Output:** `Incident` with linked alert keys.
- **DB Touchpoints:** Reads `alerts`, writes to `incidents`.

### 2. `risk_service.py` (Developer B — Phase 3)
- **Role:** Calculate a transparent, explainable risk score (0.0 to 100.0) based on asset criticality, alert frequency, severity, and MITRE weights.
- **Input:** `Incident` + associated `Alert` items.
- **Output:** `risk_score: float`, `priority: str` ('low', 'medium', 'high', 'critical').
- **DB Touchpoints:** Updates `incidents.risk_score` and `incidents.priority`.

### 3. `mitre_service.py` (Developer B — Phase 3)
- **Role:** Map correlated alert event types and behavior patterns to MITRE ATT&CK Tactics (e.g., `TA0001 - Initial Access`) and Techniques (e.g., `T1078 - Valid Accounts`).
- **Input:** `Incident` and alert telemetry.
- **Output:** `mitre_tactic: str`, `mitre_technique: str`.
- **DB Touchpoints:** Updates `incidents.mitre_tactic` and `incidents.mitre_technique`.

### 4. `ai_service.py` (Developer C — Phase 4)
- **Role:** Interface with Azure OpenAI to generate evidence-grounded investigation summaries, reconstructed attack paths, and containment recommendations.
- **Input:** `Incident` context, correlated alerts, MITRE tags, and risk metrics.
- **Output:** `Investigation` record containing `summary`, `evidence`, `attack_path`, `recommendations`.
- **DB Touchpoints:** Writes to `investigations` table linked by `incident_id`.

---

## Architectural Rules for Service Developers

1. **No Breaking API Changes:** Never modify existing fields or schemas in `backend/app/schemas/` without consensus.
2. **Stateless Service Design:** Service classes/functions should accept a `Session` dependency or pure objects, execute deterministically, and return typed data.
3. **Graceful Degradation:** External service failures (e.g. Azure OpenAI network timeout) must be caught and handled with fallback logic rather than failing the core ingestion pipeline.
