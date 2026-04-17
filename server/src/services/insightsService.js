import { PrismaClient } from "@prisma/client";
import { getSectorProfile } from "../config/sectorProfiles.js";
import sectorMap, { getSector } from "../lib/sectorMap.js";
import {
  appendAlertHistoryEntries,
  detectAlertPattern,
  escalationKey,
  getAlertHistory,
  getAlertHistoryStats,
  getRotationTrack,
  recordWeightedEscalation,
  touchPersistence,
  updateRotationTrack,
} from "../lib/alertStore.js";
import { applyMacroToAlerts, getMacroContext } from "../macro/macroContext.js";
import { getMacroExplanation } from "../agents/macroExplanation.js";

const prisma = new PrismaClient();
// legacy local sectorMap removed — use shared getSector() from lib/sectorMap.js

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = avg(values);
  const variance = avg(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
}

function toNumber(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function getMarketTrend(avgChange) {
  if (avgChange > 0.5) return "bullish";
  if (avgChange < -0.5) return "bearish";
  return "neutral";
}

function getSectorTrend(sectorAvg) {
  if (sectorAvg > 0.5) return "positive";
  if (sectorAvg < -0.5) return "negative";
  return "neutral";
}

function getTrend(latestPrice, baselinePrice) {
  if (!baselinePrice) return "stable";
  const pct = ((latestPrice - baselinePrice) / baselinePrice) * 100;
  if (pct > 0.2) return "up";
  if (pct < -0.2) return "down";
  return "stable";
}

function getVolumeSignal(latestVolume, averageVolume) {
  if (!averageVolume) return "normal";
  if (latestVolume >= averageVolume * 1.8) return "high";
  if (latestVolume <= averageVolume * 0.6) return "low";
  return "normal";
}

function buildExplanation({ trend, volumeSignal, marketTrend, sector, sectorTrend }) {
  let explanation = "Price and volume signals are mixed, with no dominant directional pressure.";

  if (trend === "down" && volumeSignal === "high" && marketTrend === "bearish") {
    explanation =
      "Stock is dropping with strong selling pressure in a bearish overall market.";
  } else if (trend === "down" && volumeSignal === "high") {
    explanation =
      "Stock is dropping with unusually high volume, indicating strong selling pressure.";
  } else if (trend === "up" && volumeSignal === "high" && marketTrend === "bullish") {
    explanation =
      "Stock is rising on strong volume while the broader market is bullish, indicating solid momentum.";
  } else if (trend === "up" && volumeSignal === "high") {
    explanation =
      "Stock is rising with strong volume participation, indicating bullish momentum.";
  } else if (trend === "down") {
    explanation = "Stock is declining on normal activity, suggesting a mild correction.";
  } else if (trend === "stable") {
    explanation = "Price action is mostly sideways with no strong volume signal.";
  } else if (trend === "up") {
    explanation = "Stock is trending up on moderate activity, showing steady buying interest.";
  }

  if (sector !== "unknown" && trend === "down" && sectorTrend === "negative") {
    explanation += ` The ${sector} sector is also under pressure.`;
  } else if (sector !== "unknown" && trend === "up" && sectorTrend === "positive") {
    explanation += ` The ${sector} sector is broadly supportive.`;
  }

  return explanation;
}

function computeConfidence({
  trend,
  volumeSignal,
  marketTrend,
  sectorTrend,
  sector,
  momentum,
  latestChange,
}) {
  let score = 0.45;
  const isUp = trend === "up";
  const isDown = trend === "down";
  const hasDirectionalTrend = isUp || isDown;

  if (hasDirectionalTrend) score += 0.1;
  if (volumeSignal === "high" && hasDirectionalTrend) score += 0.1;
  if ((isUp && momentum > 0) || (isDown && momentum < 0)) score += 0.1;
  if ((isUp && latestChange > 0) || (isDown && latestChange < 0)) score += 0.1;
  if (
    (isUp && marketTrend === "bullish") ||
    (isDown && marketTrend === "bearish")
  ) {
    score += 0.1;
  }
  if (
    sector !== "unknown" &&
    ((isUp && sectorTrend === "positive") || (isDown && sectorTrend === "negative"))
  ) {
    score += 0.05;
  }

  return Math.max(0.35, Math.min(0.98, Number(score.toFixed(2))));
}

function computeFlowConfidence(details) {
  if (!details.length) return 0.4;
  const sorted = [...details].sort((a, b) => b.flowScore - a.flowScore);
  const top = Math.abs(sorted[0]?.flowScore || 0);
  const bottom = Math.abs(sorted[sorted.length - 1]?.flowScore || 0);
  const spread = top + bottom;
  const normalized = Math.min(spread / 200000, 1);
  return Number((0.45 + normalized * 0.45).toFixed(2));
}

/** Up to `maxPerTicker` most recent rows per mnemo (marketRows must be ordered desc by ingested_at). */
function buildTickerHistoryMap(marketRows, maxPerTicker = 20) {
  const map = new Map();
  for (const row of marketRows) {
    const mnemo = (row.mnemo || "").trim().toUpperCase();
    if (!mnemo) continue;
    if (!map.has(mnemo)) map.set(mnemo, []);
    const arr = map.get(mnemo);
    if (arr.length < maxPerTicker) arr.push(row);
  }
  return map;
}

function stockVolatilityScore(rows) {
  const prices = rows.map((r) => toNumber(r.last_trade_price)).filter((v) => v > 0);
  if (prices.length < 2) return 0;
  const priceVol = stdDev(prices);
  const priceMean = avg(prices);
  if (!priceMean) return 0;
  const cv = priceVol / priceMean;
  return Math.min(cv / 0.05, 1);
}

function computeRiskState(riskScore) {
  if (riskScore > 0.7) return "High Risk";
  if (riskScore > 0.5) return "Elevated";
  return "Monitor";
}

function detectMarketRegime(outflow, inflow, risk) {
  if (!risk?.signals?.length) return "neutral";
  const banking = risk.signals.find((s) => s.sector === "banking");
  if (outflow === "banking" && banking?.timing === "risk accelerating") {
    return "risk_off_rotation";
  }
  if (
    outflow === "banking" &&
    inflow &&
    ["technology", "industrial"].includes(inflow)
  ) {
    return "risk_off_rotation";
  }
  return "neutral";
}

function deriveSubSignals(s) {
  const vol = s.volatility ?? 0;
  const flow = s.flowScore ?? 0;
  const volHigh = vol > 0.5 || (s.volatilityAccel ?? 0) > 0.1;
  const liq =
    flow < -1e6
      ? "tightening"
      : flow < 0
        ? "strained"
        : flow > 0
          ? "supportive"
          : "neutral";
  return {
    liquidity: liq,
    volatility: volHigh ? "high" : vol > 0.25 ? "elevated" : "normal",
    volume:
      s.volumeSpikeRatio >= 0.35
        ? "surging"
        : s.volumeSpikeRatio >= 0.15
          ? "elevated"
          : "normal",
    correlation: s.negativeRatio > 0.65 ? "weak (breadth)" : "ok",
  };
}

function summaryHasActionableSignals(summary, risk) {
  if (summary?.rotation) return true;
  if (summary?.anomaly) return true;
  if (!risk?.signals?.length) return false;
  return risk.signals.some((s) => s.timing === "risk accelerating");
}

function detectFlowPattern(avgChange, flowScore) {
  if (avgChange < 0 && flowScore > 0) {
    return "Accumulation phase (possible rebound)";
  }
  if (avgChange > 0 && flowScore < 0) {
    return "Distribution phase (possible drop)";
  }
  return "Neutral / trend-aligned flow";
}

function computeRiskConfidence(signals) {
  if (!signals.length) return 0.4;
  const sorted = [...signals].sort((a, b) => b.riskScore - a.riskScore);
  const top = sorted[0].riskScore;
  const second = sorted[1]?.riskScore ?? 0;
  const spread = top - second;
  const base = 0.55 + Math.min(spread * 1.2, 0.22);
  const high = top > 0.7 ? 0.12 : top > 0.5 ? 0.06 : 0;
  return Number(Math.min(0.96, base + high).toFixed(2));
}

export async function getRiskInsights() {
  const marketRows = await prisma.marketData.findMany({
    where: {
      mnemo: { not: null },
      quantity: { not: null },
      var_prev_close: { not: null },
    },
    orderBy: { ingested_at: "desc" },
    take: 2500,
  });

  if (!marketRows.length) {
    return { error: "No market data available for risk analysis.", status: 404 };
  }

  const historyByTicker = buildTickerHistoryMap(marketRows, 20);
  const now = new Date();
  const shortWindowStart = new Date(now.getTime() - 5 * 60 * 1000);
  const baseWindowStart = new Date(now.getTime() - 35 * 60 * 1000);
  const seenTickers = new Set();
  const latestByTicker = marketRows.filter((row) => {
    const mnemo = (row.mnemo || "").trim().toUpperCase();
    if (!mnemo || seenTickers.has(mnemo)) return false;
    seenTickers.add(mnemo);
    return true;
  });

  const sectorBuckets = {};
  for (const row of latestByTicker) {
    const ticker = (row.mnemo || "").trim().toUpperCase();
    const sector = getSector(ticker);
    if (!sectorBuckets[sector]) {
      sectorBuckets[sector] = {
        totalVolume: 0,
        totalChange: 0,
        count: 0,
        volScores: [],
        negativeCount: 0,
        volumeSpikeCount: 0,
        shortVolume: 0,
        baseVolume: 0,
        shortVolScores: [],
        baseVolScores: [],
        shortNegativeCount: 0,
        shortCount: 0,
        baseNegativeCount: 0,
        baseCount: 0,
      };
    }
    const bucket = sectorBuckets[sector];
    const rows = historyByTicker.get(ticker) || [row];
    const hist = rows.slice(1);
    const histQty = hist.map((r) => toNumber(r.quantity));
    const avgVolume = histQty.length ? avg(histQty) : 0;
    const latestQty = toNumber(row.quantity);
    const varClose = toNumber(row.var_prev_close);

    const volScore = stockVolatilityScore(rows);
    bucket.volScores.push(volScore);
    if (varClose < 0) bucket.negativeCount += 1;
    if (avgVolume > 0 && latestQty > avgVolume * 1.5) bucket.volumeSpikeCount += 1;

    bucket.totalVolume += latestQty;
    bucket.totalChange += varClose;
    bucket.count += 1;

    const shortRows = rows.filter((r) => {
      const t = r.ingested_at ? new Date(r.ingested_at) : null;
      return t && t > shortWindowStart;
    });
    const baseRows = rows.filter((r) => {
      const t = r.ingested_at ? new Date(r.ingested_at) : null;
      return t && t <= shortWindowStart && t > baseWindowStart;
    });

    const shortVolScore = stockVolatilityScore(shortRows);
    const baseVolScore = stockVolatilityScore(baseRows);
    const shortLatest = shortRows[0] || rows[0];
    const baseLatest = baseRows[0];

    if (shortLatest) {
      bucket.shortVolume += toNumber(shortLatest.quantity);
      bucket.shortCount += 1;
      if (toNumber(shortLatest.var_prev_close) < 0) {
        bucket.shortNegativeCount += 1;
      }
    }

    if (baseLatest) {
      bucket.baseVolume += toNumber(baseLatest.quantity);
      bucket.baseCount += 1;
      if (toNumber(baseLatest.var_prev_close) < 0) {
        bucket.baseNegativeCount += 1;
      }
    }

    if (shortVolScore > 0) bucket.shortVolScores.push(shortVolScore);
    if (baseVolScore > 0) bucket.baseVolScores.push(baseVolScore);
  }

  const signals = Object.keys(sectorBuckets).map((sector) => {
    const b = sectorBuckets[sector];
    const avgChange = b.count ? b.totalChange / b.count : 0;
    const flowScore = b.totalVolume * avgChange;
    const sectorVolatility = b.volScores.length ? avg(b.volScores) : 0;
    const negativeRatio = b.count ? b.negativeCount / b.count : 0;
    const volumeSpikeRatio = b.count ? b.volumeSpikeCount / b.count : 0;

    const flowStress = flowScore < 0 ? 0.2 : 0;
    const riskScore = Number(
      (
        sectorVolatility * 0.3 +
        negativeRatio * 0.3 +
        volumeSpikeRatio * 0.2 +
        flowStress
      ).toFixed(3)
    );

    const pattern = detectFlowPattern(avgChange, flowScore);
    const shortNegativeRatio = b.shortCount ? b.shortNegativeCount / b.shortCount : 0;
    const baseNegativeRatio = b.baseCount ? b.baseNegativeCount / b.baseCount : 0;
    const shortVolatility = b.shortVolScores.length ? avg(b.shortVolScores) : 0;
    const baseVolatility = b.baseVolScores.length ? avg(b.baseVolScores) : 0;
    const volumeAccel = b.baseVolume > 0 ? b.shortVolume / b.baseVolume : (b.shortVolume > 0 ? 2 : 1);
    const volatilityAccel = shortVolatility - baseVolatility;
    const negativeAccel = shortNegativeRatio - baseNegativeRatio;

    let timing = "stable";
    if (volumeAccel > 1.5 && negativeAccel > 0.1) {
      timing = "risk accelerating";
    } else if (volumeAccel > 1.5 && avgChange > 0) {
      timing = "momentum building";
    } else if (volumeAccel < 0.7 && volatilityAccel < 0) {
      timing = "cooling down";
    }

    let state = computeRiskState(riskScore);
    if (
      negativeRatio > 0.6 &&
      flowScore < 0 &&
      timing === "risk accelerating"
    ) {
      state = "High Risk";
    }

    return {
      sector,
      riskScore,
      state,
      pattern,
      timing,
      volatility: Number(sectorVolatility.toFixed(3)),
      negativeRatio: Number(negativeRatio.toFixed(3)),
      volumeSpikeRatio: Number(volumeSpikeRatio.toFixed(3)),
      flowScore: Number(flowScore.toFixed(2)),
      avgChange: Number(avgChange.toFixed(3)),
      volumeAccel: Number(volumeAccel.toFixed(3)),
      volatilityAccel: Number(volatilityAccel.toFixed(3)),
      negativeAccel: Number(negativeAccel.toFixed(3)),
    };
  });

  signals.sort((a, b) => b.riskScore - a.riskScore);
  const highRiskSector = signals[0]?.sector || "unknown";
  const top = signals[0];
  const confidence = computeRiskConfidence(signals);

  let explanation =
    "Sector risk levels are balanced relative to current volume and return dispersion.";
  if (top) {
    const parts = [];
    if (top.volatility > 0.5) parts.push("elevated short-term price dispersion");
    if (top.negativeRatio >= 0.5) parts.push("a majority of names trading down");
    if (top.volumeSpikeRatio >= 0.35) parts.push("notable volume stress vs recent averages");
    if (top.flowScore < 0) parts.push("negative capital flow at the sector level");
    const detail = parts.length ? parts.join(", ") : "mixed microstructure signals";
    explanation = `${top.sector} sector shows ${detail}, producing the highest composite risk score in this snapshot.`;
    if (top.pattern !== "Neutral / trend-aligned flow") {
      explanation += ` Flow pattern: ${top.pattern}.`;
    }
    if (top.timing !== "stable") {
      explanation += ` Timing signal: ${top.timing}.`;
    }
  }

  return {
    highRiskSector,
    signals,
    explanation,
    confidence,
  };
}

export async function getCapitalFlowInsights() {
  const marketRows = await prisma.marketData.findMany({
    where: {
      mnemo: { not: null },
      quantity: { not: null },
      var_prev_close: { not: null },
    },
    orderBy: { ingested_at: "desc" },
    take: 600,
  });

  if (!marketRows.length) {
    return { error: "No market data available for capital flow analysis.", status: 404 };
  }

  // Keep latest sample per ticker to avoid over-weighting heavily scraped names.
  const seenTickers = new Set();
  const latestByTicker = marketRows.filter((row) => {
    const mnemo = (row.mnemo || "").trim().toUpperCase();
    if (!mnemo || seenTickers.has(mnemo)) return false;
    seenTickers.add(mnemo);
    return true;
  });

  const sectorAggregation = {};
  latestByTicker.forEach((stock) => {
    const ticker = (stock.mnemo || "").trim().toUpperCase();
    const sector = getSector(ticker);
    if (!sectorAggregation[sector]) {
      sectorAggregation[sector] = {
        totalVolume: 0,
        totalChange: 0,
        count: 0,
      };
    }

    sectorAggregation[sector].totalVolume += toNumber(stock.quantity);
    sectorAggregation[sector].totalChange += toNumber(stock.var_prev_close);
    sectorAggregation[sector].count += 1;
  });

  const details = Object.keys(sectorAggregation).map((sector) => {
    const row = sectorAggregation[sector];
    const avgChange = row.count ? row.totalChange / row.count : 0;
    const flowScore = row.totalVolume * avgChange;
    return {
      sector,
      totalVolume: Number(row.totalVolume.toFixed(2)),
      avgChange: Number(avgChange.toFixed(3)),
      flowScore: Number(flowScore.toFixed(2)),
      direction: flowScore >= 0 ? "inflow" : "outflow",
      count: row.count,
    };
  });

  const inflowRanking = [...details].sort((a, b) => b.flowScore - a.flowScore);
  const outflowRanking = [...details].sort((a, b) => a.flowScore - b.flowScore);

  const topInflow = inflowRanking[0];
  const topOutflow = outflowRanking[0];
  const confidence = computeFlowConfidence(details);

  const explanation = topInflow && topOutflow
    ? `Capital is flowing into ${topInflow.sector} while exiting ${topOutflow.sector}, indicating a shift in market positioning.`
    : "Capital flow signal is currently inconclusive due to limited sector coverage.";

  return {
    inflow: topInflow?.sector || "unknown",
    outflow: topOutflow?.sector || "unknown",
    details: inflowRanking,
    explanation,
    confidence,
  };
}

async function getMarketStateLabel() {
  const market = await prisma.marketData.findMany({
    where: { var_prev_close: { not: null } },
    orderBy: { ingested_at: "desc" },
    take: 100,
  });
  if (!market.length) return "unknown";
  const avgChange = avg(market.map((row) => toNumber(row.var_prev_close)));
  return getMarketTrend(avgChange);
}

async function computeSummaryDataQuality(flow, risk) {
  let multiplier = 1;
  const flowSectors = flow?.details?.length ?? 0;
  const riskSectors = risk?.signals?.length ?? 0;
  if (flowSectors < 2) multiplier *= 0.5;
  if (riskSectors < 2) multiplier *= 0.9;

  const latestRow = await prisma.marketData.findFirst({
    orderBy: { ingested_at: "desc" },
    select: { ingested_at: true },
  });
  const latest = latestRow?.ingested_at ? new Date(latestRow.ingested_at) : null;
  if (latest) {
    const ageMin = (Date.now() - latest.getTime()) / 60000;
    if (ageMin > 10) multiplier *= 0.6;
    else if (ageMin > 5) multiplier *= 0.85;
  } else {
    multiplier *= 0.5;
  }

  return Number(Math.max(0.35, Math.min(1, multiplier)).toFixed(3));
}

export async function getUnifiedSummary() {
  const [flowResult, riskResult] = await Promise.all([
    getCapitalFlowInsights(),
    getRiskInsights(),
  ]);

  const flow = flowResult?.error ? null : flowResult;
  const risk = riskResult?.error ? null : riskResult;

  if (!flow && !risk) {
    return { error: "Insufficient data to build market summary.", status: 503 };
  }

  const marketState = await getMarketStateLabel();

  const inflow =
    flow?.inflow && flow.inflow !== "unknown" ? flow.inflow : null;
  const outflow =
    flow?.outflow && flow.outflow !== "unknown" ? flow.outflow : null;

  const regime = detectMarketRegime(outflow, inflow, risk);

  let relativeRotationStrength = null;
  if (flow?.details?.length) {
    const tech = flow.details.find((d) => d.sector === "technology");
    const bank = flow.details.find((d) => d.sector === "banking");
    if (tech && bank && Math.abs(bank.flowScore) > 1e-6) {
      relativeRotationStrength = Number(
        (tech.flowScore / Math.abs(bank.flowScore)).toFixed(2)
      );
    }
  }

  let opportunityStrength = null;
  const techSig = risk?.signals?.find((s) => s.sector === "technology");
  const techFlowRow = flow?.details?.find((d) => d.sector === "technology");
  if (
    techSig &&
    techFlowRow &&
    techFlowRow.flowScore > 0 &&
    techSig.negativeRatio < 0.2
  ) {
    opportunityStrength = "strong";
  }

  let rotation = null;
  if (inflow && outflow && inflow !== outflow) {
    rotation = `${outflow} → ${inflow}`;
  }

  const highRiskSignal = risk?.signals?.find((s) => s.state === "High Risk");
  const highRiskSector =
    (risk?.highRiskSector && risk.highRiskSector !== "unknown"
      ? risk.highRiskSector
      : null) ||
    highRiskSignal?.sector ||
    "unknown";

  const opportunitySector = inflow || "unknown";

  const shortTermRiskSignals = risk?.signals?.filter((s) => s.timing !== "stable") || [];
  const mediumTermStates = risk?.signals?.map((s) => s.state) || [];
  const shortTerm = shortTermRiskSignals.some((s) => s.timing === "risk accelerating")
    ? "instability increasing"
    : shortTermRiskSignals.some((s) => s.timing === "momentum building")
      ? "momentum pockets building"
      : shortTermRiskSignals.some((s) => s.timing === "cooling down")
        ? "pressure cooling"
        : "stable";
  const mediumTerm = mediumTermStates.includes("High Risk")
    ? "elevated risk environment"
    : mediumTermStates.includes("Elevated")
      ? "selective risk pockets"
      : "mixed";

  let anomaly = null;
  if (inflow && highRiskSector !== "unknown" && inflow === highRiskSector) {
    anomaly = "capital flowing into high-risk sector";
  }

  let summary = "Market conditions are mixed.";
  if (rotation && highRiskSignal) {
    if (highRiskSignal.sector === outflow) {
      summary = `Capital appears to be rotating from ${highRiskSignal.sector} into ${inflow}, with ${highRiskSignal.sector} showing the strongest risk flags.`;
    } else if (highRiskSignal.sector === inflow) {
      summary = `Flow favors ${inflow}, but ${highRiskSignal.sector} remains the highest-risk sector — monitor for false strength.`;
    } else {
      summary = `Flow suggests rotation from ${outflow} to ${inflow}. Highest risk sector: ${highRiskSignal.sector}.`;
    }
  } else if (rotation) {
    summary = `Capital flow suggests rotation from ${outflow} into ${inflow}.`;
  } else if (risk && highRiskSector !== "unknown") {
    summary = `No clear sector rotation signal; ${highRiskSector} stands out on composite risk.`;
  }

  if (shortTerm === "instability increasing") {
    summary += " Short-term instability is increasing.";
  }

  summary += ` Medium-term regime: ${mediumTerm}. Overall market tone: ${marketState}.`;
  if (anomaly) {
    summary += ` Anomaly: ${anomaly}.`;
  }

  const flowConf = flow?.confidence ?? 0.45;
  const riskConf = risk?.confidence ?? 0.45;
  let confidence = Number(((flowConf + riskConf) / 2).toFixed(2));
  const dataQualityMultiplier = await computeSummaryDataQuality(flow, risk);
  confidence = Number((confidence * dataQualityMultiplier).toFixed(2));
  confidence = Math.min(0.96, Math.max(0.35, confidence));

  return {
    rotation,
    rotationFrom: outflow,
    rotationTo: inflow,
    regime,
    relativeRotationStrength,
    opportunityStrength,
    highRiskSector,
    opportunitySector,
    marketState,
    shortTerm,
    mediumTerm,
    anomaly,
    confidence,
    confidenceBreakdown: {
      flow: Number(flowConf.toFixed(2)),
      risk: Number(riskConf.toFixed(2)),
      dataQuality: dataQualityMultiplier,
    },
    summary: summary.trim(),
    dataQualityMultiplier,
  };
}

function computeAlertScore(riskScore, volumeAccel, summaryConfidence) {
  const rs = Math.min(Math.max(toNumber(riskScore), 0), 1);
  const volNorm = Math.min(Math.max(toNumber(volumeAccel) / 2, 0), 1);
  const conf = Math.min(Math.max(toNumber(summaryConfidence), 0), 1);
  return rs * 0.5 + volNorm * 0.3 + conf * 0.2;
}

function applyActionLayer(alert, summary) {
  const base = { ...alert };
  if (alert.severity === "low") {
    base.stance = "watch";
    base.hint = "Reduced model confidence — situational awareness only.";
    return base;
  }
  if (alert.type === "risk") {
    if (alert.severity === "high" || alert.severity === "critical") {
      base.stance = "defensive";
      base.hint = "Avoid exposure or reduce risk";
    } else {
      base.stance = "caution";
      base.hint = "Monitor closely; conditions may worsen";
    }
    return base;
  }
  if (alert.type === "rotation") {
    const inflow = summary.opportunitySector && summary.opportunitySector !== "unknown"
      ? summary.opportunitySector
      : "inflow sector";
    base.stance = "watch";
    base.hint = `Monitor inflow sector (${inflow})`;
    return base;
  }
  if (alert.type === "anomaly") {
    base.stance = "caution";
    base.hint = "Conflicting signals detected";
    return base;
  }
  base.stance = "neutral";
  base.hint = "Review supporting signals below.";
  return base;
}

function severityRank(s) {
  if (s === "critical") return 0;
  if (s === "high") return 1;
  if (s === "medium") return 2;
  if (s === "low") return 4;
  return 5;
}

function mergeSeverity(a, b) {
  return severityRank(a) <= severityRank(b) ? a : b;
}

/**
 * Actionable alerts from unified summary + risk signals.
 * Respects summary confidence gate. WS broadcast uses separate dedup cooldown.
 * @param {{ sideEffects?: boolean }} [options] If false, skip history append and escalation/rotation mutations (for read-only consumers such as the AI route).
 */
async function loadMacroContextSafe() {
  try {
    return await getMacroContext();
  } catch {
    return {
      context: { regime: "neutral", pressure: "none", label: null },
      signals: [],
      source: "INS",
      unavailable: true,
    };
  }
}

export async function getMarketAlerts(options = {}) {
  const sideEffects = options.sideEffects !== false;
  const macroPromise = loadMacroContextSafe();
  const macroExplanationPromise = macroPromise.then((m) => getMacroExplanation(m));
  const [summaryResult, riskResult, macro] = await Promise.all([
    getUnifiedSummary(),
    getRiskInsights(),
    macroPromise,
  ]);

  if (summaryResult?.error) {
    return { error: summaryResult.error, status: summaryResult.status || 503 };
  }

  const summary = summaryResult;
  const risk = riskResult?.error ? null : riskResult;
  const conf = summary.confidence;
  const signalsPresent = summaryHasActionableSignals(summary, risk);

  if (conf < 0.4) {
    const patternEarly = detectAlertPattern();
    return {
      alerts: [],
      confidence: conf,
      suppressedReason: "very_low_confidence",
      signalsPresent,
      regime: summary.regime,
      globalContext: null,
      pattern: patternEarly.pattern,
      patternDetail: patternEarly.detail,
      rotationIntel: getRotationTrack(),
      macro,
      history: getAlertHistory(30),
      historyStats: getAlertHistoryStats(),
    };
  }

  const lowConfidenceMode = conf >= 0.4 && conf < 0.6;
  const candidates = [];

  if (risk?.signals?.length) {
    for (const s of risk.signals) {
      if (s.state === "High Risk" && s.timing === "risk accelerating") {
        const score = computeAlertScore(s.riskScore, s.volumeAccel, conf);
        const severity = score > 0.8 ? "high" : "medium";
        candidates.push({
          type: "risk",
          message: `${s.sector} risk is accelerating`,
          severity,
          score: Number(score.toFixed(3)),
          sector: s.sector,
          signals: deriveSubSignals(s),
        });
      }
    }
  }

  if (summary.rotationFrom && summary.rotationTo) {
    const rel = summary.relativeRotationStrength ?? 0;
    let durMin = 0;
    if (sideEffects) {
      updateRotationTrack(summary.rotationFrom, summary.rotationTo, rel);
      const track = getRotationTrack();
      durMin = track ? (Date.now() - track.since) / 60000 : 0;
    }
    const strengthLabel =
      rel > 2 ? "strong" : rel > 1 ? "moderate" : "emerging";
    const score = computeAlertScore(0.5, 1, conf);
    const severity = score > 0.8 ? "high" : "medium";
    const durPart =
      sideEffects && durMin >= 1
        ? `${Math.round(durMin)} min`
        : "tracking…";
    candidates.push({
      type: "rotation",
      message: `Capital rotating from ${summary.rotationFrom} → ${summary.rotationTo} (${strengthLabel}, ${durPart})`,
      severity,
      score: Number(score.toFixed(3)),
      sector: null,
      rotation: {
        from: summary.rotationFrom,
        to: summary.rotationTo,
        strength: rel,
        durationMinutes: Math.round(durMin),
      },
    });
  }

  if (summary.anomaly) {
    const score = computeAlertScore(0.85, 1, conf);
    candidates.push({
      type: "anomaly",
      message: summary.anomaly,
      severity: score > 0.8 ? "high" : "medium",
      score: Number(score.toFixed(3)),
      sector: summary.highRiskSector,
    });
  }

  const totalCand = candidates.length;
  const bankingCand = candidates.filter((c) => c.sector === "banking").length;
  const dominance = totalCand ? bankingCand / totalCand : 0;
  let globalContext = null;
  if (
    getSectorProfile("banking").systemic &&
    dominance > 0.5 &&
    bankingCand > 0
  ) {
    globalContext = {
      code: "systemic_pressure",
      label: "Systemic banking pressure detected",
      dominance: Number(dominance.toFixed(2)),
    };
  }

  const patternResult = detectAlertPattern();

  const alerts = candidates.map((a) => {
    const key = escalationKey(a);
    const profile = getSectorProfile(a.sector);
    const weightedScore = (a.score || 0) * (profile.escalationWeight || 1);
    let severity = a.severity;
    let persist = { durationMinutes: 0 };
    let weightedTier = null;

    if (sideEffects) {
      persist = touchPersistence(key);
      const w = recordWeightedEscalation(key, weightedScore);
      weightedTier = w.tier;
      if (weightedTier === "critical") severity = "critical";
      else if (weightedTier === "high") severity = mergeSeverity(severity, "high");
    }

    if (profile.systemic && severity === "high") {
      severity = "critical";
    }

    if (lowConfidenceMode) {
      severity = "low";
    }

    let message = a.message;
    if (sideEffects && persist.durationMinutes >= 2) {
      const base = message.replace(/\s*\(persistent\)\s*$/i, "").trim();
      message = `${base} (persisting ${Math.round(persist.durationMinutes)} min)`;
    }

    let out = {
      ...a,
      severity,
      message,
      lowConfidenceMode,
      weightedEscalationTier: weightedTier,
      durationMinutes: Math.round(persist.durationMinutes),
    };
    out = applyActionLayer(out, summary);
    return out;
  });

  const alertsAfterMacro = applyMacroToAlerts(alerts, macro, summary);

  alertsAfterMacro.sort((a, b) => {
    const ra = severityRank(a.severity);
    const rb = severityRank(b.severity);
    if (ra !== rb) return ra - rb;
    return (b.score || 0) - (a.score || 0);
  });

  if (sideEffects) {
    const ts = new Date().toISOString();
    appendAlertHistoryEntries(
      alertsAfterMacro.map((a) => ({
        message: a.message,
        sector: a.sector,
        severity: a.severity,
        type: a.type,
        stance: a.stance,
        hint: a.hint,
        timestamp: ts,
      }))
    );
  }

  function formatMacroForUI(m) {
    if (!m) return null;
    const signals = m.signals || {};
    const indicators = m.indicators || {};
    return {
      externalPressure: signals.external_pressure ? "YES" : "NO",
      monetaryPolicy: signals.monetary_tightening
        ? "Tightening"
        : signals.monetary_easing
        ? "Easing"
        : "Neutral",
      policyRate: Number.isFinite(indicators.policy_rate) ? indicators.policy_rate : null,
      moneyMarketRate: Number.isFinite(indicators.money_market_rate)
        ? indicators.money_market_rate
        : null,
      bctConfidence: m.meta?.bctConfidence ?? null,
      policyRateProxy: !!indicators.policy_rate_proxy,
    };
  }

  return {
    alerts: alertsAfterMacro,
    confidence: conf,
    lowConfidenceMode,
    signalsPresent,
    regime: summary.regime,
    globalContext,
    pattern: patternResult.pattern,
    patternDetail: patternResult.detail,
    rotationIntel: getRotationTrack(),
    opportunityStrength: summary.opportunityStrength,
    macro,
    macroUi: formatMacroForUI(macro),
    macroExplanation: await macroExplanationPromise,
    history: getAlertHistory(30),
    historyStats: getAlertHistoryStats(),
  };
}

export async function explainTicker(ticker) {
  const normalizedTicker = (ticker || "").trim().toUpperCase();

  if (!normalizedTicker) {
    return { error: "Ticker is required.", status: 400 };
  }

  const records = await prisma.marketData.findMany({
    where: { mnemo: normalizedTicker },
    orderBy: { ingested_at: "desc" },
    take: 20,
  });

  if (!records.length) {
    return { error: `No market data found for ticker ${normalizedTicker}.`, status: 404 };
  }

  const latest = records[0];
  const history = records.slice(1);
  const latestPrice = toNumber(latest.last_trade_price);
  const latestVolume = toNumber(latest.quantity);
  const latestChange = toNumber(latest.var_prev_close);

  const baselineRecord = records[records.length - 1];
  const baselinePrice = toNumber(baselineRecord?.last_trade_price);
  const historicalVolumes = history.map((r) => toNumber(r.quantity)).filter((v) => v > 0);
  const averageVolume = avg(historicalVolumes);

  const historicalPrices = history.map((r) => toNumber(r.last_trade_price)).filter((v) => v > 0);
  const volatility = historicalPrices.length > 1 ? stdDev(historicalPrices) : 0;
  const momentum = baselinePrice ? latestPrice - baselinePrice : 0;

  const market = await prisma.marketData.findMany({
    where: { var_prev_close: { not: null } },
    orderBy: { ingested_at: "desc" },
    take: 100,
  });
  const avgChange = market.length
    ? avg(market.map((row) => toNumber(row.var_prev_close)))
    : 0;
  const marketTrend = getMarketTrend(avgChange);

  const sector = getSector(normalizedTicker);
  let sectorAvg = 0;
  let sectorTrend = "neutral";

  // Only compute sector aggregates if the sector is known in our mapping
  const knownSectors = new Set(Object.values(sectorMap));
  if (knownSectors.has(sector)) {
    const sectorTickers = Object.keys(sectorMap).filter((key) => sectorMap[key] === sector);
    const sectorStocks = await prisma.marketData.findMany({
      where: {
        mnemo: { in: sectorTickers },
        var_prev_close: { not: null },
      },
      orderBy: { ingested_at: "desc" },
      take: 50,
    });

    sectorAvg = sectorStocks.length
      ? avg(sectorStocks.map((row) => toNumber(row.var_prev_close)))
      : 0;
    sectorTrend = getSectorTrend(sectorAvg);
  }

  const trend = getTrend(latestPrice, baselinePrice);
  const volumeSignal = getVolumeSignal(latestVolume, averageVolume);
  const explanation = buildExplanation({
    trend,
    volumeSignal,
    marketTrend,
    sector,
    sectorTrend,
  });
  const confidence = computeConfidence({
    trend,
    volumeSignal,
    marketTrend,
    sectorTrend,
    sector,
    momentum,
    latestChange,
  });

  return {
    ticker: normalizedTicker,
    price: latestPrice,
    change: latestChange,
    volume: latestVolume,
    signals: {
      trend,
      volume: volumeSignal,
      marketTrend,
      sector,
      sectorTrend,
      averageVolume: Number(averageVolume.toFixed(2)),
      volatility: Number(volatility.toFixed(2)),
      momentum: Number(momentum.toFixed(3)),
    },
    explanation,
    confidence,
  };
}
