import { llm } from "../lib/llm.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// In-memory macro explanation cache / state
let lastFingerprint = null;
let lastExplanation = null;
let lastIndicators = null;

// Disk cache file alongside this module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, "macroExplanation.cache.json");

async function loadCache() {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf8");
    const obj = JSON.parse(raw);
    lastFingerprint = obj.lastFingerprint || null;
    lastExplanation = obj.lastExplanation || null;
    lastIndicators = obj.lastIndicators || null;
  } catch (e) {
    // ignore if file doesn't exist or is invalid
  }
}

async function saveCache() {
  try {
    const out = {
      lastFingerprint,
      lastExplanation,
      lastIndicators,
    };
    await fs.writeFile(CACHE_FILE, JSON.stringify(out, null, 2), "utf8");
  } catch (e) {
    // non-fatal
    console.error("Failed to write macro cache:", e?.message || e);
  }
}

// Kick off loading cache (don't block module init)
loadCache().catch(() => {});

function stripCodeFence(text) {
  const trimmed = (text || "").trim();
  const m = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (m) return m[1].trim();
  return trimmed;
}

export function buildMacroExplanationInput(macroContext) {
  const indicators = macroContext?.indicators || {};
  const signals = macroContext?.signals || {};
  const meta = macroContext?.meta || {};

  // Map to a clean, strict input for the AI layer
  return {
    externalPressure: !!signals.external_pressure,
    monetaryPolicy: signals.monetary_tightening
      ? "TIGHTENING"
      : signals.monetary_easing
      ? "EASING"
      : "NEUTRAL",
    policyRate: Number.isFinite(indicators.policy_rate) ? indicators.policy_rate : null,
    moneyMarketRate: Number.isFinite(indicators.money_market_rate) ? indicators.money_market_rate : null,
    // inflationSignal is not yet available in data pipeline
    inflationSignal: null,
    confidence: (meta.bctConfidence || "high").toUpperCase(),
    policyRateProxy: !!indicators.policy_rate_proxy,
    // include raw indicator snapshot for fingerprinting and delta computation
    _raw_indicators: {
      inflation: indicators.inflation ?? null,
      policy_rate: indicators.policy_rate ?? null,
      money_market_rate: indicators.money_market_rate ?? null,
      external_pressure: !!signals.external_pressure,
      monetary_policy: signals.monetary_tightening ? "TIGHTENING" : signals.monetary_easing ? "EASING" : "NEUTRAL",
    },
  };
}

function buildPrompt(macroInput) {
  const schema = '{\n'
    + '  "summary": "string (max 2 lines)",\n'
    + '  "macro_regime": "RISK_ON | RISK_OFF | NEUTRAL",\n'
    + '  "confidence": "LOW | MEDIUM | HIGH",\n'
    + '  "drivers": [{\n'
    + '    "type": "INFLATION | LIQUIDITY | RATES | EXTERNAL",\n'
    + '    "impact": "BULLISH | BEARISH | NEUTRAL",\n'
    + '    "explanation": "short factual sentence"\n'
    + '  }],\n'
    + '  "implications": ["string"],\n'
    + '  "risks": ["string"],\n'
    + '  "score": { "risk": "0-100", "opportunity": "0-100" }\n'
    + '}';

  const lines = [];
  lines.push('You are a financial macro analyst.');
  lines.push('');
  lines.push('You MUST ONLY use the provided input data. DO NOT invent facts or cite external sources.');
  lines.push('Return ONLY valid JSON matching this exact schema (no markdown, no extra text).');
  lines.push('');
  lines.push('Rules:');
  lines.push('- Keep summary under 2 lines');
  lines.push('- Each driver explanation must reference input signals');
  lines.push('- No generic or global statements');
  lines.push('- If data is insufficient, set confidence to LOW and keep arrays empty');
  lines.push('');
  lines.push('Additional rules:');
  lines.push("- ALWAYS mention the delta (change) for each numeric variable provided (inflation, policy_rate, money_market_rate). If no change, use the word \"unchanged\" for that variable.");
  lines.push("- If the input includes '_raw_indicators' and 'deltas', reference those deltas numerically (e.g. \"inflation +0.4% -> 7.2% (increased)\").");
  lines.push('- Avoid these repetitive phrases: "remains high", "continues to", "stable environment". Prefer explicit deltas or the word "unchanged".');
  lines.push('');
  lines.push('Schema:');
  lines.push(schema);
  lines.push('');
  lines.push('Input (sole source):');
  lines.push(JSON.stringify(macroInput, null, 2));

  return lines.join('\n');
}

export function fallbackMacroExplanation(ctx) {
  // deterministic minimal JSON fallback
  const regime = ctx?.regime === "risk_off_macro" || ctx?.externalPressure ? "RISK_OFF" : "NEUTRAL";
  const confidence = ctx?.bct_confidence ? (ctx.bct_confidence.toUpperCase() === "MEDIUM" ? "MEDIUM" : "HIGH") : "LOW";
  return {
    summary: regime === "RISK_OFF" ? "Macro conditions indicate tightening with external pressure." : "Macro conditions are currently neutral.",
    macro_regime: regime,
    confidence,
    drivers: [],
    implications: [],
    risks: [],
    score: { risk: 0, opportunity: 0 },
  };
}

export async function getMacroExplanation(macroContext) {
  const input = buildMacroExplanationInput(macroContext);

  // Build a fingerprint from the raw indicators to detect meaningful changes
  const raw = input._raw_indicators || {};
  const fingerprintObj = {
    inflation: raw.inflation ?? null,
    policy_rate: raw.policy_rate ?? null,
    money_market_rate: raw.money_market_rate ?? null,
    external_pressure: raw.external_pressure ?? false,
    monetary_policy: raw.monetary_policy || "NEUTRAL",
  };
  const fingerprint = JSON.stringify(fingerprintObj);

  // If nothing meaningful changed, reuse last explanation
  if (lastFingerprint && fingerprint === lastFingerprint && lastExplanation) {
    return lastExplanation;
  }

  // Compute deltas relative to previous indicators (if present)
  const deltas = {};
  if (lastIndicators) {
    const prev = lastIndicators;
    if (typeof raw.inflation === "number" && typeof prev.inflation === "number") deltas.inflation_delta = Number((raw.inflation - prev.inflation).toFixed(2));
    if (typeof raw.policy_rate === "number" && typeof prev.policy_rate === "number") deltas.policy_rate_delta = Number((raw.policy_rate - prev.policy_rate).toFixed(2));
    if (typeof raw.money_market_rate === "number" && typeof prev.money_market_rate === "number") deltas.money_market_rate_delta = Number((raw.money_market_rate - prev.money_market_rate).toFixed(2));
  }

  // If we have previous indicators and none of the key indicators changed, return deterministic 'no change' explanation
  if (lastIndicators) {
    const infZero = typeof deltas.inflation_delta === "number" && deltas.inflation_delta === 0;
    const rateZero = typeof deltas.policy_rate_delta === "number" && deltas.policy_rate_delta === 0;
    const mmZero = typeof deltas.money_market_rate_delta === "number" && deltas.money_market_rate_delta === 0;
    if (infZero && rateZero && mmZero) {
      const deterministic = {
        summary: "No significant macro change",
        macro_regime: "NEUTRAL",
        confidence: input.confidence || "MEDIUM",
        drivers: [],
        implications: ["Market direction likely driven by micro factors"],
        risks: [],
        score: { risk: 50, opportunity: 50 },
        signal: "WATCH",
      };
      // update cache/state so we reuse this until fingerprint changes
      lastFingerprint = fingerprint;
      lastExplanation = deterministic;
      lastIndicators = raw;
      // persist to disk (non-blocking)
      saveCache().catch(() => {});
      return deterministic;
    }
  }

  // Augment input with deltas for the prompt
  const augmentedInput = { ...input, deltas };
  const prompt = buildPrompt(augmentedInput);

  try {
    const rawText = await llm({
      model: "llama-3.1-8b-instant",
      temperature: 0.05,
      maxTokens: 300,
      messages: [
        { role: "system", content: "You are a financial macro analyst." },
        { role: "user", content: prompt },
      ],
    });

    const text = stripCodeFence(rawText || "");
    if (!text || !text.trim()) return fallbackMacroExplanation(input);

    try {
      const parsed = JSON.parse(text);
      // Basic validation: must have summary and macro_regime
      if (!parsed || typeof parsed.summary !== "string" || !parsed.macro_regime) {
        return fallbackMacroExplanation(input);
      }

      // Blacklist repetitive generic phrases — if detected reuse last explanation
      const blacklist = [/remains high/i, /continues to/i, /stable environment/i, /no change/i];
      const matchesBlacklist = (str) => !!(str && blacklist.some((r) => r.test(str)));
      if (matchesBlacklist(parsed.summary) || (Array.isArray(parsed.drivers) && parsed.drivers.some((d) => matchesBlacklist(d.explanation)))) {
        if (lastExplanation) return lastExplanation;
        return fallbackMacroExplanation(input);
      }

      // Ensure score exists and normalize
      if (!parsed.score || typeof parsed.score !== "object") {
        parsed.score = { risk: 0, opportunity: 0 };
      } else {
        parsed.score.risk = Number(parsed.score.risk) || 0;
        parsed.score.opportunity = Number(parsed.score.opportunity) || 0;
      }

      // If confidence is MEDIUM/LOW and policyRateProxy, ensure mention via drivers
      if ((input.confidence === "MEDIUM" || input.confidence === "LOW") && input.policyRateProxy) {
        const hasProxyDriver = Array.isArray(parsed.drivers) && parsed.drivers.some((d) => /proxy|money market/i.test(d.explanation || ""));
        if (!hasProxyDriver) {
          parsed.drivers = parsed.drivers || [];
          parsed.drivers.push({ type: "RATES", impact: "NEUTRAL", explanation: "Policy rate proxied from money market rate (lower data confidence)." });
        }
      }

      // Successful parse — update cache/state
      lastFingerprint = fingerprint;
      lastExplanation = parsed;
      lastIndicators = raw;
      // persist to disk (non-blocking)
      saveCache().catch(() => {});

      return parsed;
    } catch (e) {
      return fallbackMacroExplanation(input);
    }
  } catch (e) {
    return fallbackMacroExplanation(input);
  }
}
