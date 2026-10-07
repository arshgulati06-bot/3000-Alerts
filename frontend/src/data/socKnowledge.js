/**
 * SOC knowledge base + explainable rule-based investigation engine.
 *
 * This is NOT an external LLM. Every statement produced here is derived from
 * deterministic rules over the incident's correlated alerts, so each conclusion
 * can be traced back to evidence. The same structured output contract is what
 * the Azure OpenAI summarizer (services/ai_service.py, future phase) will fill.
 */

export const MITRE_TECHNIQUES = {
  'T1059': { name: 'Command and Scripting Interpreter', tactic: 'Execution', why: 'Attackers abuse built-in interpreters to run payloads without dropping obvious binaries.' },
  'T1059.001': { name: 'PowerShell', tactic: 'Execution', why: 'Encoded / hidden PowerShell is a top initial execution vector for fileless malware and C2 stagers.' },
  'T1003.001': { name: 'OS Credential Dumping: LSASS Memory', tactic: 'Credential Access', why: 'Dumping LSASS yields reusable credentials and Kerberos tickets that enable lateral movement.' },
  'T1021.002': { name: 'Remote Services: SMB/Admin Shares', tactic: 'Lateral Movement', why: 'SMB probing from a compromised server indicates the attacker is expanding to new hosts.' },
  'T1053.005': { name: 'Scheduled Task/Job', tactic: 'Persistence', why: 'A masqueraded scheduled task lets the attacker survive reboots and remediation.' },
  'T1071.001': { name: 'Application Layer Protocol: Web', tactic: 'Command and Control', why: 'Beaconing over HTTPS blends attacker control traffic into normal web traffic.' },
  'T1490': { name: 'Inhibit System Recovery', tactic: 'Impact', why: 'Deleting shadow copies is a near-certain precursor to ransomware encryption.' },
  'T1486': { name: 'Data Encrypted for Impact', tactic: 'Impact', why: 'Mass high-entropy writes indicate active encryption of business data.' },
  'T1110.003': { name: 'Brute Force: Password Spraying', tactic: 'Credential Access', why: 'Low-and-slow spraying across many accounts evades per-account lockout policies.' },
  'T1621': { name: 'MFA Request Generation', tactic: 'Credential Access', why: 'MFA fatigue attacks rely on a user approving one of many unsolicited prompts.' },
  'T1078': { name: 'Valid Accounts', tactic: 'Initial Access / Persistence', why: 'Compromised legitimate credentials bypass most perimeter controls.' },
  'T1574.002': { name: 'Hijack Execution Flow: DLL Side-Loading', tactic: 'Defense Evasion', why: 'Loading a malicious DLL through a signed binary evades application allow-listing.' },
  'T1558.003': { name: 'Steal or Forge Kerberos Tickets: Kerberoasting', tactic: 'Credential Access', why: 'Service tickets with weak ciphers can be cracked offline to recover service account passwords.' },
  'T1046': { name: 'Network Service Discovery', tactic: 'Discovery', why: 'Port scanning maps exposed services an attacker can target next.' },
};

/** Alert event_type → MITRE technique (normalization rule table) */
export const EVENT_TECHNIQUE = {
  obfuscated_powershell: 'T1059.001',
  lsass_memory_access: 'T1003.001',
  lateral_smb_probe: 'T1021.002',
  persistence_task_created: 'T1053.005',
  c2_beacon_detected: 'T1071.001',
  shadow_copy_deletion: 'T1490',
  boot_config_tampering: 'T1490',
  high_entropy_file_write: 'T1486',
  mfa_push_bombing: 'T1621',
  dll_sideload_detected: 'T1574.002',
  kerberoasting_tgs_request: 'T1558.003',
  external_port_scan: 'T1046',
  port_scan_detected: 'T1046',
  authentication_failure: 'T1110.003',
  impossible_travel: 'T1078',
};

/** Timeline event title keywords → technique */
const TIMELINE_KEYWORDS = [
  [/powershell/i, 'T1059.001'],
  [/lsass|credential dump/i, 'T1003.001'],
  [/smb|445|lateral/i, 'T1021.002'],
  [/scheduled task|schtasks/i, 'T1053.005'],
  [/c2|beacon/i, 'T1071.001'],
  [/vssadmin|shadow|bcdedit|recovery/i, 'T1490'],
  [/encrypt|entropy/i, 'T1486'],
  [/spray/i, 'T1110.003'],
  [/mfa/i, 'T1621'],
  [/dll|sideload/i, 'T1574.002'],
  [/kerber|tgs/i, 'T1558.003'],
  [/scan|recon/i, 'T1046'],
];

export function techniqueForText(text = '') {
  const hit = TIMELINE_KEYWORDS.find(([re]) => re.test(text));
  return hit ? hit[1] : null;
}

export function techniqueId(mitreString = '') {
  return (mitreString.match(/T\d{4}(\.\d{3})?/) || [null])[0];
}

export function severityLabel(sev) {
  if (typeof sev === 'string') return sev.toLowerCase();
  if (sev >= 9) return 'critical';
  if (sev >= 7) return 'high';
  if (sev >= 4) return 'medium';
  if (sev >= 2) return 'low';
  return 'info';
}

export function relatedAlerts(incident, alerts = []) {
  if (!incident) return [];
  return alerts
    .filter(a => a.asset_id && a.asset_id === incident.asset_id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/** All techniques observed for an incident, with provenance */
export function incidentTechniques(incident, alerts = []) {
  const ids = new Map();
  const add = (id, source) => {
    if (!id) return;
    if (!ids.has(id)) ids.set(id, new Set());
    ids.get(id).add(source);
  };
  add(techniqueId(incident?.mitre_technique), 'Incident classification');
  (incident?.timeline || []).forEach(ev => add(techniqueForText(`${ev.event} ${ev.details}`), `Timeline: ${ev.event}`));
  relatedAlerts(incident, alerts).forEach(a => add(EVENT_TECHNIQUE[a.event_type], `Alert ${a.external_alert_id || a.id}`));
  return [...ids.entries()].map(([id, sources]) => ({
    id,
    ...(MITRE_TECHNIQUES[id] || { name: 'Technique', tactic: '—', why: '' }),
    sources: [...sources],
  }));
}

/**
 * Explainable rule-based analysis. Produces the structured investigation
 * contract: summary, risk assessment, suspicious indicators, attack chain,
 * affected assets, MITRE mapping, recommended actions.
 */
export function analyzeIncident(incident, alerts = []) {
  if (!incident) return null;
  const related = relatedAlerts(incident, alerts);
  const techniques = incidentTechniques(incident, alerts);
  const tactics = [...new Set(techniques.map(t => t.tactic))];
  const risk = Math.round(incident.risk_score || 0);
  const level = risk >= 85 ? 'CRITICAL' : risk >= 70 ? 'HIGH' : risk >= 40 ? 'MEDIUM' : 'LOW';

  const assets = new Set([incident.asset_id]);
  (incident.timeline || []).forEach(ev => ev.asset && assets.add(ev.asset));
  const externalIps = new Set();
  [...related, ...(incident.timeline || [])].forEach(x => {
    const ip = x.destination_ip || '';
    if (/^\d+\.\d+\.\d+\.\d+$/.test(ip) && !/^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(ip)) externalIps.add(ip);
  });

  const why = [];
  if (techniques.length >= 3) why.push(`${techniques.length} distinct ATT&CK techniques across ${tactics.length} tactics on the same asset — a multi-stage pattern rarely produced by benign activity.`);
  if (related.some(a => a.severity >= 9)) why.push(`${related.filter(a => a.severity >= 9).length} correlated alert(s) scored critical (≥9/10) by the source sensors.`);
  if (tactics.includes('Credential Access')) why.push('Credential access behaviour detected — compromised credentials can extend the blast radius beyond this host.');
  if (tactics.includes('Lateral Movement')) why.push('Lateral movement indicators show spread toward additional internal systems.');
  if (tactics.includes('Impact')) why.push('Impact-stage behaviour (recovery inhibition / encryption) indicates imminent business disruption.');
  if (externalIps.size) why.push(`Outbound communication to external address(es) ${[...externalIps].join(', ')}.`);
  (incident.risk_factors || []).forEach(f => why.push(`${f.label} (${f.weight}).`));

  const chain = (incident.timeline || []).map(ev => ({
    time: ev.time,
    step: ev.event,
    technique: techniqueForText(`${ev.event} ${ev.details}`),
  }));

  const summary = incident.ai_investigation?.summary ||
    `${incident.alert_count || related.length} correlated alerts on ${incident.asset_id} indicate ${tactics.join(' → ') || 'suspicious activity'}.`;

  const recommendations = (incident.ai_investigation?.recommendations || []).length
    ? incident.ai_investigation.recommendations
    : [
        { action: 'Isolate affected endpoint', detail: `Network-isolate ${incident.asset_id} via EDR.`, priority: 'immediate' },
        { action: 'Revoke suspicious sessions', detail: 'Invalidate active tokens for implicated accounts.', priority: 'immediate' },
        { action: 'Reset compromised credentials', detail: 'Force password reset for affected principals.', priority: 'high' },
        { action: 'Preserve forensic evidence', detail: 'Capture memory and disk images before remediation.', priority: 'high' },
      ];

  return {
    summary,
    riskLevel: level,
    risk,
    confidence: incident.confidence || `${Math.min(99, 60 + techniques.length * 7)}%`,
    why,
    chain,
    assets: [...assets],
    externalIps: [...externalIps],
    techniques,
    tactics,
    recommendations,
    observed: incident.ai_investigation?.observed_evidence || [],
  };
}
