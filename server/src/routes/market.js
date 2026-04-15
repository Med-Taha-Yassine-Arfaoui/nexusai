import express from "express";
import { PrismaClient } from "@prisma/client";
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

    res.json({ stocks, gainers, losers, active });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch market data", details: err.message });
  }
});

export default router;