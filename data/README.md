# Sworders SOC — Security Datasets Directory

This directory is designated for raw, synthetic, or benchmark security alert datasets (e.g. CSV, JSON lines, PCAP logs) used for testing the SOC correlation and investigation pipeline.

---

## Dataset Format Standard

Alert datasets should be formatted or transformed to match the `AlertCreate` ingestion schema:

```json
{
  "external_alert_id": "ALERT-2026-9041",
  "timestamp": "2026-09-30T14:22:15Z",
  "source_ip": "192.168.1.105",
  "destination_ip": "10.0.0.50",
  "source_port": 54210,
  "destination_port": 80,
  "protocol": "HTTP",
  "event_type": "sql_injection_attempt",
  "severity": 8,
  "asset_id": "WEB-SRV-01",
  "user": "anonymous",
  "description": "SQL injection detected in GET query parameter 'user_id'",
  "raw_data": {
    "uri": "/api/users?user_id=1%27%20OR%201=1--",
    "user_agent": "sqlmap/1.7#stable",
    "response_code": 403
  }
}
```

---

## Field Specifications

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `external_alert_id` | String | No | Unique ID from SIEM/sensor. Duplicates are rejected with HTTP 409. |
| `timestamp` | ISO 8601 String | Yes | Event timestamp (UTC recommended). |
| `source_ip` | String | No | Source IPv4 / IPv6 address. |
| `destination_ip` | String | No | Target IPv4 / IPv6 address. |
| `source_port` | Integer | No | Source port (0–65535). |
| `destination_port`| Integer | No | Destination port (0–65535). |
| `protocol` | String | No | Protocol (e.g., TCP, UDP, HTTP, DNS). |
| `event_type` | String | Yes | Normalized event classification. |
| `severity` | Integer | Yes | Severity scale: 1 (Low) to 10 (Critical). |
| `asset_id` | String | No | Target host, hostname, or workload tag. |
| `user` | String | No | Target or actor user account. |
| `description` | String | No | Human-readable alert summary. |
| `raw_data` | Object | No | Original raw JSON telemetry. |
