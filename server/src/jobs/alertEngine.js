import { getMarketAlerts } from "../services/insightsService.js";
import {
  broadcastMarketAlerts,
  filterAlertsForBroadcast,
} from "../ws/marketAlertBroadcast.js";

const DEFAULT_MS = 30_000;

/**
 * Background tick: same logic as GET /api/insights/alerts (WS dedup applies).
 */
export function startAlertEngine(intervalMs = DEFAULT_MS) {
  const tick = async () => {
    try {
      const result = await getMarketAlerts();
      if (result?.error) return;
      const toPush = filterAlertsForBroadcast(result.alerts || []);
      if (toPush.length) {
        broadcastMarketAlerts({
          alerts: toPush,
          confidence: result.confidence,
        });
      }
    } catch (err) {
      console.error("[alertEngine] tick failed:", err.message);
    }
  };

  const id = setInterval(tick, intervalMs);
  tick();
  return () => clearInterval(id);
}
