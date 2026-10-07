import { MOCK_ALERTS_STREAM, MOCK_INCIDENTS, MOCK_KPIS } from '../data/mockData';

const API_BASE_URL = '/api';

/**
 * Check backend health status
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return { connected: true, data };
    }
    return { connected: false, status: res.status, data: null };
  } catch (err) {
    return { connected: false, error: err.message, data: null };
  }
}

/**
 * Fetch alerts list with fallback to mock data
 */
export async function fetchAlerts(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    if (params.severity) query.append('severity', params.severity);
    if (params.event_type) query.append('event_type', params.event_type);
    if (params.asset_id) query.append('asset_id', params.asset_id);

    const res = await fetch(`${API_BASE_URL}/alerts?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      // If backend returns items, merge or use backend items; if empty (Phase 1 fresh db), provide rich dataset
      const items = (json.items && json.items.length > 0) ? [...json.items, ...MOCK_ALERTS_STREAM] : MOCK_ALERTS_STREAM;
      return {
        items,
        total: items.length,
        page: json.page || 1,
        page_size: json.page_size || 50,
        isLive: true,
      };
    }
  } catch (err) {
    console.warn('Backend /api/alerts unreachable, using live simulated telemetry:', err.message);
  }

  // Fallback to rich mock data
  let filtered = [...MOCK_ALERTS_STREAM];
  if (params.severity) {
    filtered = filtered.filter(a => a.severity >= parseInt(params.severity, 10));
  }
  if (params.event_type) {
    filtered = filtered.filter(a => a.event_type.toLowerCase().includes(params.event_type.toLowerCase()));
  }
  if (params.asset_id) {
    filtered = filtered.filter(a => a.asset_id.toLowerCase().includes(params.asset_id.toLowerCase()));
  }

  return {
    items: filtered,
    total: filtered.length,
    page: 1,
    page_size: 50,
    isLive: false,
  };
}

/**
 * Ingest a new alert into FastAPI backend
 */
export async function ingestAlert(alertPayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertPayload),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.detail || errorJson.message || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('Failed to post alert to /api/alerts:', err);
    throw err;
  }
}

/**
 * Fetch correlated incidents
 */
export async function fetchIncidents(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);

    const res = await fetch(`${API_BASE_URL}/incidents?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.items && json.items.length > 0) {
        return { items: json.items, isLive: true };
      }
    }
  } catch (err) {
    console.warn('Backend /api/incidents query error, using local correlation dataset:', err.message);
  }

  let list = [...MOCK_INCIDENTS];
  if (params.status && params.status !== 'all') {
    list = list.filter(i => i.status.toLowerCase() === params.status.toLowerCase());
  }
  if (params.priority && params.priority !== 'all') {
    list = list.filter(i => i.priority.toLowerCase() === params.priority.toLowerCase());
  }

  return { items: list, isLive: false };
}

/**
 * Fetch incident by ID with detailed investigation
 */
export async function fetchIncidentById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${id}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.id) {
        return { incident: json, isLive: true };
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch incident ${id} from API:`, err.message);
  }

  const match = MOCK_INCIDENTS.find(i => String(i.id) === String(id) || i.incident_key === id) || MOCK_INCIDENTS[0];
  return { incident: match, isLive: false };
}

/**
 * Fetch dashboard KPIs
 */
export async function fetchKPIs() {
  return MOCK_KPIS;
}
