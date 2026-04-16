import { prisma } from "../lib/prisma.js";

const TRADE_DELTA_NEGATIVE = 500;
const TRADE_DELTA_POSITIVE = 500;

export async function loadLatestIndicators() {
  const indicators = {};

  const trade = await prisma.macroIndicator.findMany({
    where: { source: "INS", indicator: "trade_balance" },
    orderBy: { rowOrder: "desc" },
    take: 2,
  });
  const tradeLatest = Number(trade[0]?.value);
  const tradePrev = Number(trade[1]?.value);
  indicators.trade_balance = Number.isFinite(tradeLatest) ? tradeLatest : null;
  indicators.prev_trade_balance = Number.isFinite(tradePrev) ? tradePrev : null;

  const bct = await prisma.macroIndicator.findMany({
    where: { source: "BCT", indicator: { in: ["policy_rate", "money_market_rate"] } },
    orderBy: [{ period: "desc" }, { createdAt: "desc" }],
    take: 30,
  });
  const policySeries = bct.filter((r) => r.indicator === "policy_rate");
  const latestPolicy = Number(policySeries[0]?.value);
  const prevPolicy = Number(policySeries[1]?.value);
  const mmrSeries = bct.filter((r) => r.indicator === "money_market_rate");
  const latestMmr = Number(mmrSeries[0]?.value);
  const prevMmr = Number(mmrSeries[1]?.value);
  indicators.money_market_rate = Number.isFinite(latestMmr) ? latestMmr : null;
  indicators.prev_money_market_rate = Number.isFinite(prevMmr) ? prevMmr : null;

  const hasPolicySeries = Number.isFinite(latestPolicy);
  indicators.policy_rate = hasPolicySeries
    ? latestPolicy
    : Number.isFinite(latestMmr)
      ? latestMmr
      : null;
  indicators.prev_policy_rate = Number.isFinite(prevPolicy)
    ? prevPolicy
    : Number.isFinite(prevMmr)
      ? prevMmr
      : null;
  const latestPolicyProxyMeta = Boolean(policySeries[0]?.meta?.proxy);
  indicators.policy_rate_proxy =
    latestPolicyProxyMeta || (!hasPolicySeries && Number.isFinite(latestMmr));

  return indicators;
}

export function computeMacroSignals(indicators) {
  const signals = {
    external_pressure: false,
    monetary_tightening: false,
    monetary_easing: false,
    regime: "neutral",
    details: [],
  };

  const trade = indicators.trade_balance;
  const prevTrade = indicators.prev_trade_balance;
  if (Number.isFinite(trade) && Number.isFinite(prevTrade)) {
    const delta = trade - prevTrade;
    if (delta < -TRADE_DELTA_NEGATIVE || trade < -500) {
      signals.external_pressure = true;
      signals.details.push(
        `INS trade balance deteriorating: Δ ${delta.toFixed(1)} M TND`
      );
    } else if (delta > TRADE_DELTA_POSITIVE) {
      signals.details.push(
        `INS trade balance improving: Δ +${delta.toFixed(1)} M TND`
      );
    }
  }

  const policy = indicators.policy_rate;
  const prevPolicy = indicators.prev_policy_rate;
  if (Number.isFinite(policy) && Number.isFinite(prevPolicy)) {
    if (policy > prevPolicy) {
      signals.monetary_tightening = true;
      signals.details.push(`BCT policy rate increased (${prevPolicy} → ${policy})`);
    } else if (policy < prevPolicy) {
      signals.monetary_easing = true;
      signals.details.push(`BCT policy rate eased (${prevPolicy} → ${policy})`);
    }
  }
  if (indicators.policy_rate_proxy) {
    signals.details.push("Policy signal proxied from TMM");
  }

  if (signals.external_pressure && signals.monetary_tightening) {
    signals.regime = "risk_off_macro";
  }

  return signals;
}

export async function computeMacroSignalsFromDb() {
  const indicators = await loadLatestIndicators();
  return {
    indicators,
    signals: computeMacroSignals(indicators),
  };
}
