import express from "express";
import {
  explainTicker,
  getCapitalFlowInsights,
  getMarketAlerts,
  getRiskInsights,
  getUnifiedSummary,
} from "../services/insightsService.js";
import {
  broadcastMarketAlerts,
  filterAlertsForBroadcast,
} from "../ws/marketAlertBroadcast.js";
import { runMarketSummaryAi } from "../agents/marketSummaryAi.js";

const router = express.Router();

router.get("/explain/:ticker", async (req, res) => {
  try {
    const result = await explainTicker(req.params.ticker);

    if (result?.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to generate market insight.",
      details: err.message,
    });
  }
});

router.get("/capital-flow", async (req, res) => {
  try {
    const result = await getCapitalFlowInsights();

    if (result?.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to generate capital flow insights.",
      details: err.message,
    });
  }
});

router.get("/risk", async (req, res) => {
  try {
    const result = await getRiskInsights();

    if (result?.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to generate sector risk insights.",
      details: err.message,
    });
  }
});

router.get("/alerts", async (req, res) => {
  try {
    const result = await getMarketAlerts();

    if (result?.error) {
      return res.status(result.status || 503).json({ error: result.error });
    }

    const toPush = filterAlertsForBroadcast(result.alerts || []);
    if (toPush.length) {
      broadcastMarketAlerts({
        alerts: toPush,
        confidence: result.confidence,
      });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to generate market alerts.",
      details: err.message,
    });
  }
});

router.get("/summary/ai", async (req, res) => {
  try {
    const deterministic = await getUnifiedSummary();

    if (deterministic?.error) {
      return res.status(deterministic.status || 503).json({ error: deterministic.error });
    }

    const alertResult = await getMarketAlerts({ sideEffects: false });
    const intelligence = alertResult?.error
      ? null
      : {
          alerts: alertResult.alerts,
          globalContext: alertResult.globalContext,
          pattern: alertResult.pattern,
          patternDetail: alertResult.patternDetail,
          lowConfidenceMode: alertResult.lowConfidenceMode,
          signalsPresent: alertResult.signalsPresent,
        };

    const { payload: ai, source } = await runMarketSummaryAi(deterministic, intelligence);

    return res.json({
      deterministic,
      ai,
      aiSource: source,
      intelligence,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to generate AI-augmented market summary.",
      details: err.message,
    });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const result = await getUnifiedSummary();

    if (result?.error) {
      return res.status(result.status || 503).json({ error: result.error });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to generate unified market summary.",
      details: err.message,
    });
  }
});

export default router;
