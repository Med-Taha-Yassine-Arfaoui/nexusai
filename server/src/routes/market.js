import express from "express";
import { PrismaClient } from "@prisma/client";
import { getSector } from "../lib/sectorMap.js";
console.log("MARKET ROUTE LOADED");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const latest = await prisma.marketData.findMany({
      orderBy: { ingested_at: "desc" },
      take: 200,
    });

    const seen = new Set();
    const stocks = latest.filter(s => {
      if (seen.has(s.mnemo)) return false;
      seen.add(s.mnemo);
      return true;
    });

    const gainers = [...stocks].sort((a, b) => b.var_prev_close - a.var_prev_close).slice(0, 5);
    const losers = [...stocks].sort((a, b) => a.var_prev_close - b.var_prev_close).slice(0, 5);
    const active = [...stocks].sort((a, b) =>
      (b.quantity * b.last_trade_price) - (a.quantity * a.last_trade_price)
    ).slice(0, 5);

    // Compute sector-level aggregates
    const sectors = {};
    for (const s of stocks) {
      const sec = getSector(s.mnemo);
      const vol = (s.quantity || 0) * (s.last_trade_price || 0);
      const perf = Number(s.var_prev_close) || 0; // percent or variation

      if (!sectors[sec]) sectors[sec] = { count: 0, totalPerf: 0, totalVol: 0, flow: 0, members: [] };
      sectors[sec].count += 1;
      sectors[sec].totalPerf += perf;
      sectors[sec].totalVol += vol;
      // flow = sum(volume * variation) — capital movement proxy
      sectors[sec].flow += vol * perf;
      sectors[sec].members.push({ mnemo: s.mnemo, perf, vol });
    }

    const sectorList = Object.keys(sectors).map((k) => {
      const st = sectors[k];
      const avgPerf = st.count ? st.totalPerf / st.count : 0;
      const strength = avgPerf * Math.log1p(st.totalVol || 0);
      return {
        sector: k,
        avgPerformance: Number(avgPerf.toFixed(4)),
        totalVolume: Number(st.totalVol.toFixed(2)),
        flow: Number(st.flow.toFixed(2)),
        strength: Number((isFinite(strength) ? strength : 0).toFixed(4)),
        members: st.members,
      };
    });

    const topByPerf = [...sectorList].sort((a, b) => b.avgPerformance - a.avgPerformance).slice(0, 5);
    const topByFlow = [...sectorList].sort((a, b) => b.flow - a.flow).slice(0, 5);

    res.json({ stocks, gainers, losers, active, sectors: sectorList, topSectors: { byPerf: topByPerf, byFlow: topByFlow } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch market data", details: err.message });
  }
});

export default router;