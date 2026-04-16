import { prisma } from "../../lib/prisma.js";
import { runBctIngest } from "../bct/bctIngestJob.js";
import { fetchInsIndicator } from "./insClient.js";
import { parseInsSeries } from "./insParser.js";

const DEFAULT_TRADE_BALANCE_ID = "1675780959";
const TRADE_BALANCE_COLUMN = "Trade balance";

export async function ingestInsMacroSeries({ insId, indicator, valueColumn }) {
  const raw = await fetchInsIndicator(insId);
  const series = parseInsSeries(raw);

  for (const row of series) {
    const v = row[valueColumn];
    if (v === null || v === undefined || Number.isNaN(v)) continue;

    await prisma.macroIndicator.upsert({
      where: {
        source_indicator_period: {
          source: "INS",
          indicator,
          period: String(row.period),
        },
      },
      create: {
        source: "INS",
        indicator,
        period: String(row.period),
        value: v,
        rowOrder: Number(row.rowOrder) || 0,
        meta: row,
      },
      update: {
        value: v,
        rowOrder: Number(row.rowOrder) || 0,
        meta: row,
      },
    });
  }
}

export async function ingestTradeBalanceFromIns() {
  const id = process.env.INS_TRADE_BALANCE_ID || DEFAULT_TRADE_BALANCE_ID;
  await ingestInsMacroSeries({
    insId: id,
    indicator: "trade_balance",
    valueColumn: TRADE_BALANCE_COLUMN,
  });
}

export async function ingestGdpFromInsIfConfigured() {
  const id = process.env.INS_GDP_ID;
  const col = process.env.INS_GDP_COLUMN;
  if (!id || !col) return;
  await ingestInsMacroSeries({
    insId: id,
    indicator: "gdp",
    valueColumn: col,
  });
}

export async function runMacroIngestTick() {
  await ingestTradeBalanceFromIns();
  await ingestGdpFromInsIfConfigured();
  try {
    await runBctIngest();
  } catch (e) {
    console.error("[macroIngest:bct]", e.message);
  }
}
