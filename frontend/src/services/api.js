import { MOCK_ALERTS_STREAM, MOCK_INCIDENTS, MOCK_KPIS } from '../data/mockData';

const API_BASE_URL = '/api';
const TIMEOUT_MS = 5000;

const TOKEN_KEY = 'sworders_token';
const USER_KEY = 'sworders_user';

function storage() {
  try { return window.localStorage; } catch { return null; }
}

export function getStoredSession() {
  try {
    const token = storage()?.getItem(TOKEN_KEY);
    const user = JSON.parse(storage()?.getItem(USER_KEY) || 'null');
    return token ? { token, user } : null;
  } catch {
    return null;
  }
}

function storeSession(token, user) {
  try {
    storage()?.setItem(TOKEN_KEY, token);
    storage()?.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* private mode: session lasts for this tab only */ }
}

export function clearSession() {
  try {
    storage()?.removeItem(TOKEN_KEY);
    storage()?.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

/** fetch with timeout so a hung backend never freezes the UI; attaches the bearer token */
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const token = getStoredSession()?.token;
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The SOC API did not respond in time.');
    throw new Error('Cannot reach the SOC API. Is the backend running on port 8000?');
  } finally {
    clearTimeout(timer);
  }
}

/** Turn any FastAPI error body into one readable sentence (never a stack trace). */
async function readError(res) {
  const body = await res.json().catch(() => null);
  // Dev proxy answers with an empty 5xx when the FastAPI process is down
  if (!body && res.status >= 500) return 'Cannot reach the SOC API. Is the backend running on port 8000?';
  if (!body) return `Request failed (HTTP ${res.status}).`;
  if (Array.isArray(body.details) && body.details.length) {
    return body.details.map(d => `${String(d.field || '').split(' -> ').pop()}: ${d.message}`).join('; ');
  }
  if (typeof body.detail === 'string') return body.detail;
  if (res.status >= 500) return 'The SOC API hit an internal error. Please retry.';
  return body.message || `Request failed (HTTP ${res.status}).`;
}

/** SQLite returns naive ISO timestamps; they are UTC, so make that explicit for the browser. */
function utc(ts) {
  if (typeof ts !== 'string') return ts;
  return /([zZ]|[+-]\d\d:?\d\d)$/.test(ts) ? ts : `${ts}Z`;
}

function normalizeAlert(a) {
  return { ...a, timestamp: utc(a.timestamp), created_at: utc(a.created_at) };
}

// ---------------------------------------------------------------------------
// Authentication (demo analyst accounts — POST /api/auth/*)
// ---------------------------------------------------------------------------
async function authRequest(path, payload) {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  const json = await res.json();
  if (!json?.access_token || !json?.user) throw new Error('Unexpected response from the authentication service.');
  storeSession(json.access_token, json.user);
  return json.user;
}

export const login = (email, password) => authRequest('/auth/login', { email, password });
export const register = (fullName, email, password) => authRequest('/auth/register', { full_name: fullName, email, password });

/** Validate a stored token. Returns user, null (invalid/expired) or throws if the API is unreachable. */
export async function fetchCurrentUser() {
  const res = await apiFetch('/auth/me');
  if (res.status === 401) { clearSession(); return null; }
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
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
  merged.created_at = utc(merged.created_at);
  merged.updated_at = utc(merged.updated_at);
  return merged;
}

/** Update incident workflow status (PATCH /api/incidents/{id}). Returns { ok, status, error }. */
export async function updateIncidentStatus(id, status) {
  try {
    const res = await apiFetch(`/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) return { ok: true, status: res.status };
    return { ok: false, status: res.status, error: await readError(res) };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

/**
 * Check backend health status
 */
export async function checkHealth() {
  try {
    const res = await apiFetch(`/health`);
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
  if (!params.offline) try {
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
      const items = live ? json.items.map(normalizeAlert) : MOCK_ALERTS_STREAM;
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

    if (!res.ok) throw new Error(await readError(res));
    return normalizeAlert(await res.json());
  } catch (err) {
    console.error('Failed to post alert to /api/alerts:', err);
    throw err;
  }
}

/**
 * Fetch correlated incidents
 */
export async function fetchIncidents(params = {}) {
  if (!params.offline) try {
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

/** Live GET probes used by the System Status page. Returns HTTP status per endpoint (0 = no response). */
export async function probeReadEndpoints() {
  const probe = async (path) => {
    try { return (await apiFetch(path)).status; } catch { return 0; }
  };
  const [alerts, incidents] = await Promise.all([probe('/alerts?page_size=1'), probe('/incidents?page_size=1')]);
  let incident = 0;
  try {
    const list = await (await apiFetch('/incidents?page_size=1')).json();
    incident = list.items?.[0] ? await probe(`/incidents/${list.items[0].id}`) : 404;
  } catch { incident = 0; }
  return { alerts, incidents, incident };
}
