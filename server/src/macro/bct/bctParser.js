import * as cheerio from "cheerio";

function toRate(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(",", ".").replace(/[^\d.-]/g, "");
  const v = parseFloat(cleaned);
  return Number.isFinite(v) ? v : null;
}

function pickLatestMonthlyValue($) {
  const monthRx =
    /^(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)$/i;
  let latest = null;

  $("table tr").each((_, el) => {
    const cols = $(el).find("td");
    if (cols.length < 2) return;
    const label = $(cols[0]).text().trim().toLowerCase();
    if (!monthRx.test(label)) return;
    const values = cols
      .map((i, td) => $(td).text().trim())
      .get()
      .slice(1);
    const lastValidText = [...values].reverse().find((v) => toRate(v) !== null);
    const v = toRate(lastValidText);
    if (v !== null) latest = v;
  });

  return latest;
}

export function parseBctRates(html) {
  const $ = cheerio.load(html);
  const out = {};

  $("table tr").each((_, el) => {
    const cols = $(el).find("td");
    if (cols.length < 2) return;

    const label = $(cols[0]).text().trim().toLowerCase();
    const values = cols
      .map((i, td) => $(td).text().trim())
      .get()
      .slice(1);
    const lastValidText = [...values].reverse().find((v) => toRate(v) !== null);
    const value = toRate(lastValidText);
    if (!label || value === null) return;

    if (label.includes("taux directeur") || label.includes("directeur")) {
      out.policy_rate = value;
      if (process.env.BCT_PARSER_DEBUG === "1") {
        console.log("[BCT parser] policy_rate", label, "|", value);
      }
    } else if (
      label.includes("marché monétaire") ||
      label.includes("marche monetaire") ||
      label.includes("monetaire")
    ) {
      out.money_market_rate = value;
      if (process.env.BCT_PARSER_DEBUG === "1") {
        console.log("[BCT parser] money_market_rate", label, "|", value);
      }
    } else if (label.includes("tmm")) {
      out.money_market_rate = value;
      if (process.env.BCT_PARSER_DEBUG === "1") {
        console.log("[BCT parser] money_market_rate", label, "|", value);
      }
    } else if (label.includes("facilité de prêt") || label.includes("pret")) {
      out.lending_rate = value;
      if (process.env.BCT_PARSER_DEBUG === "1") {
        console.log("[BCT parser] lending_rate", label, "|", value);
      }
    } else if (
      label.includes("facilité de dépôt") ||
      label.includes("depot")
    ) {
      out.deposit_rate = value;
      if (process.env.BCT_PARSER_DEBUG === "1") {
        console.log("[BCT parser] deposit_rate", label, "|", value);
      }
    }
  });

  // Fallback for time-series layouts (months in rows, years in columns).
  if (!Object.keys(out).length) {
    const pageText = $.text().toLowerCase();
    const latestMonthly = pickLatestMonthlyValue($);
    if (latestMonthly !== null) {
      if (pageText.includes("marché monétaire") || pageText.includes("tmm")) {
        out.money_market_rate = latestMonthly;
      } else if (pageText.includes("directeur")) {
        out.policy_rate = latestMonthly;
      }
      if (process.env.BCT_PARSER_DEBUG === "1" && Object.keys(out).length) {
        console.log("[BCT parser] fallback monthly value:", latestMonthly);
      }
    }
  }

  return out;
}
