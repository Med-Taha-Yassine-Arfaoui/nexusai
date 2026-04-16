import { prisma } from "../../lib/prisma.js";
import { fetchBctRates } from "./bctClient.js";
import { parseBctRates } from "./bctParser.js";

export async function runBctIngest() {
  const html = await fetchBctRates();
  const data = parseBctRates(html);
  const usedPolicyFallback =
    !Number.isFinite(data.policy_rate) && Number.isFinite(data.money_market_rate);
  if (!data.policy_rate && Number.isFinite(data.money_market_rate)) {
    // Fallback proxy: keep at least one policy-rate-like anchor.
    data.policy_rate = data.money_market_rate;
  }
  const period = new Date().toISOString().slice(0, 10);

  for (const indicator of Object.keys(data)) {
    const value = data[indicator];
    if (!Number.isFinite(value)) continue;
    await prisma.macroIndicator.upsert({
      where: {
        source_indicator_period: {
          source: "BCT",
          indicator,
          period,
        },
      },
      update: {
        value,
        rowOrder: 0,
        meta: {
          scrapedAt: new Date().toISOString(),
          proxy: indicator === "policy_rate" ? usedPolicyFallback : false,
        },
      },
      create: {
        source: "BCT",
        indicator,
        period,
        value,
        rowOrder: 0,
        meta: {
          scrapedAt: new Date().toISOString(),
          proxy: indicator === "policy_rate" ? usedPolicyFallback : false,
        },
      },
    });
  }
}
