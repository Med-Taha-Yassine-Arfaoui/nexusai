/** @type {import("ws").WebSocketServer | null} */
let wssRef = null;

const BROADCAST_COOLDOWN_MS = 10 * 60 * 1000;
const lastBroadcastByKey = new Map();

export function setMarketAlertWss(wss) {
  wssRef = wss;
}

function broadcastDedupKey(alert) {
  const sector = alert.sector ?? "global";
  return `${alert.type}:${sector}`;
}

/**
 * Same alert type+sector is not pushed over WS more than once per cooldown window
 * (HTTP GET /alerts still returns the full live list).
 */
export function filterAlertsForBroadcast(alerts) {
  if (!alerts?.length) return [];
  const out = [];
  for (const a of alerts) {
    const key = broadcastDedupKey(a);
    const last = lastBroadcastByKey.get(key) || 0;
    if (Date.now() - last < BROADCAST_COOLDOWN_MS) continue;
    lastBroadcastByKey.set(key, Date.now());
    out.push(a);
  }
  return out;
}

/**
 * Push latest market alerts to all connected clients.
 * Payload shape: { alerts, confidence?, generatedAt }
 */
export function broadcastMarketAlerts(payload) {
  if (!wssRef?.clients?.size) return;
  const data = JSON.stringify({
    type: "market_alerts",
    ...payload,
    generatedAt: payload.generatedAt || new Date().toISOString(),
  });
  for (const client of wssRef.clients) {
    if (client.readyState === 1) {
      try {
        client.send(data);
      } catch {
        /* ignore */
      }
    }
  }
}
