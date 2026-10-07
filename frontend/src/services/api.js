import { MOCK_ALERTS_STREAM, MOCK_INCIDENTS, MOCK_KPIS } from '../data/mockData';

const API_BASE_URL = '/api';
const TIMEOUT_MS = 5000;

/** fetch with timeout so a hung backend never freezes the UI */
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Map backend status vocabulary onto the analyst workflow: NEW → INVESTIGATING → CONTAINED → RESOLVED */
export function normalizeStatus(status) {
  const s = (status || 'new').toLowerCase();
  if (s === 'open') return 'new';
  if (s === 'closed') return 'resolved';
  return s;
}

/**
 * Backend incidents carry the persisted fields (status, risk, MITRE, AI investigation).
 * Presentation-only enrichment (title, timeline, risk factors) is joined by incident_key
 * from the demo dataset until the correlation engine produces it server-side.
 */
function enrichIncident(apiIncident) {
  const base = MOCK_INCIDENTS.find(m => m.incident_key === apiIncident.incident_key) || {};
  const inv = apiIncident.investigations?.[0];
  const merged = {
    ...base,
    ...Object.fromEntries(Object.entries(apiIncident).filter(([, v]) => v !== null && v !== undefined)),
    title: base.title || apiIncident.summary?.slice(0, 80) || apiIncident.incident_key,
    severity: base.severity || apiIncident.priority || 'medium',
    timeline: base.timeline || [],
    evidence: (inv?.evidence?.length && typeof inv.evidence[0] === 'object') ? inv.evidence : (base.evidence || []),
  };
  if (inv) {
    merged.ai_investigation = {
      ...(base.ai_investigation || {}),
      summary: inv.summary || base.ai_investigation?.summary,
      attack_path: inv.attack_path?.length ? inv.attack_path : base.ai_investigation?.attack_path,
      recommendations: inv.recommendations?.length ? inv.recommendations : base.ai_investigation?.recommendations,
    };
  }
  merged.status = normalizeStatus(merged.status);
  return merged;
}

/** Update incident workflow status (PATCH /api/incidents/{id}). Returns true if persisted. */
export async function updateIncidentStatus(id, status) {
  try {
    const res = await apiFetch(`/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Check backend health status
 */
export async function checkHealth() {
  try {
    const res = await apiFetch(`/health`, {
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

    const res = await apiFetch(`/alerts?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      // If backend returns items, merge or use backend items; if empty (Phase 1 fresh db), provide rich dataset
      if (!Array.isArray(json.items)) throw new Error('Malformed /api/alerts response');
      const live = json.items.length > 0;
      const items = live ? json.items : MOCK_ALERTS_STREAM;
      return {
        items,
        total: live ? json.total : items.length,
        page: json.page || 1,
        page_size: json.page_size || 50,
        isLive: live,
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
    const res = await apiFetch(`/alerts`, {
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

    query.append('page_size', 200);
    const res = await apiFetch(`/incidents?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.items) && json.items.length > 0) {
        // List endpoint omits investigations; fetch details in parallel for full context
        const detailed = await Promise.all(json.items.map(async (inc) => {
          try {
            const d = await apiFetch(`/incidents/${inc.id}`);
            return d.ok ? await d.json() : inc;
          } catch { return inc; }
        }));
        return { items: detailed.map(enrichIncident).sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)), isLive: true };
      }
    }
  } catch (err) {
    console.warn('Backend /api/incidents query error, using local correlation dataset:', err.message);
  }

  let list = MOCK_INCIDENTS.map(i => ({ ...i, status: normalizeStatus(i.status) }));
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
    const res = await apiFetch(`/incidents/${id}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.id) {
        return { incident: enrichIncident(json), isLive: true };
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
