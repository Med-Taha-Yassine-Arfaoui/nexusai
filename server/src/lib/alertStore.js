/** In-memory alert history + weighted escalation + persistence (swap for DB later). */

const HISTORY_CAP = 500;
const ESCALATION_WINDOW_MS = 30 * 60 * 1000;
const STATS_HOUR_MS = 60 * 60 * 1000;

/** @type {{ message: string, sector: string | null, severity: string, type: string, stance: string, hint: string, timestamp: string }[]} */
const alertHistory = [];

/** key -> { t, score }[] within escalation window */
const weightedByKey = new Map();

/** key -> { firstSeen, lastSeen } */
const persistByKey = new Map();

/** Latest capital rotation leg (from flow summary). */
let rotationTrack = null;

/** Stable key for repeat / escalation (not tied to message wording). */
export function escalationKey(alert) {
  const sector = alert.sector ?? "global";
  return `${alert.type}:${sector}`;
}

/**
 * Sum alert scores in the last 30m for this key; tier hints for escalation.
 */
export function recordWeightedEscalation(key, score) {
  const now = Date.now();
  let arr = weightedByKey.get(key) || [];
  arr = arr.filter((e) => now - e.t < ESCALATION_WINDOW_MS);
  arr.push({ t: now, score: Number(score) || 0 });
  weightedByKey.set(key, arr);
  const totalWeight = arr.reduce((s, e) => s + e.score, 0);
  let tier = null;
  if (totalWeight > 2.2) tier = "critical";
  else if (totalWeight > 1.4) tier = "high";
  return { totalWeight, tier, sampleCount: arr.length };
}

export function touchPersistence(key) {
  const now = Date.now();
  let meta = persistByKey.get(key);
  if (!meta) {
    meta = { firstSeen: now, lastSeen: now };
  } else {
    meta = { ...meta, lastSeen: now };
  }
  persistByKey.set(key, meta);
  const durationMs = now - meta.firstSeen;
  return {
    firstSeen: meta.firstSeen,
    lastSeen: meta.lastSeen,
    durationMs,
    durationMinutes: durationMs / 60000,
  };
}

export function updateRotationTrack(from, to, strength) {
  const now = Date.now();
  if (!from || !to || from === to) {
    return rotationTrack;
  }
  const s = Number(strength);
  if (
    !rotationTrack ||
    rotationTrack.from !== from ||
    rotationTrack.to !== to
  ) {
    rotationTrack = {
      from,
      to,
      since: now,
      strength: Number.isFinite(s) ? s : 0,
      lastUpdate: now,
    };
  } else {
    rotationTrack.lastUpdate = now;
    if (Number.isFinite(s)) {
      rotationTrack.strength = Math.max(rotationTrack.strength || 0, s);
    }
  }
  return rotationTrack;
}

export function getRotationTrack() {
  return rotationTrack;
}

export function detectAlertPattern() {
  const now = Date.now();
  let bankingLastHour = 0;
  let riskCount = 0;
  let rotationCount = 0;
  for (let i = alertHistory.length - 1; i >= 0; i--) {
    const h = alertHistory[i];
    const t = new Date(h.timestamp).getTime();
    if (Number.isNaN(t) || now - t > STATS_HOUR_MS) break;
    if (h.sector === "banking" || (h.message && /banking/i.test(h.message))) {
      bankingLastHour += 1;
    }
    if (h.type === "risk") riskCount += 1;
    if (h.type === "rotation") rotationCount += 1;
  }
  if (bankingLastHour >= 5) {
    return {
      pattern: "sustained_banking_stress",
      detail: `${bankingLastHour} banking-related alerts in the last hour`,
    };
  }
  if (riskCount >= 3 && rotationCount >= 3) {
    return {
      pattern: "unstable_regime",
      detail: "Alternating risk and rotation signals in the last hour",
    };
  }
  return { pattern: null, detail: null };
}

export function appendAlertHistoryEntries(entries) {
  for (const e of entries) {
    alertHistory.push({
      message: e.message,
      sector: e.sector ?? null,
      severity: e.severity,
      type: e.type,
      stance: e.stance,
      hint: e.hint,
      timestamp: e.timestamp || new Date().toISOString(),
    });
    if (alertHistory.length > HISTORY_CAP) {
      alertHistory.splice(0, alertHistory.length - HISTORY_CAP);
    }
  }
}

export function getAlertHistory(limit = 50) {
  const n = Math.min(limit, alertHistory.length);
  return alertHistory.slice(-n).reverse();
}

export function getAlertHistoryStats() {
  const now = Date.now();
  let lastHour = 0;
  const bySector = {};
  for (let i = alertHistory.length - 1; i >= 0; i--) {
    const h = alertHistory[i];
    const t = new Date(h.timestamp).getTime();
    if (Number.isNaN(t)) continue;
    if (now - t <= STATS_HOUR_MS) {
      lastHour += 1;
      const sec = h.sector || "unknown";
      bySector[sec] = (bySector[sec] || 0) + 1;
    }
  }
  return {
    totalBuffered: alertHistory.length,
    alertsLastHour: lastHour,
    bySector,
  };
}
