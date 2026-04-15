import { llm } from "../lib/llm.js";

const STANCES = new Set(["bullish", "bearish", "neutral", "defensive"]);

const SYSTEM_PROMPT = `You are a financial market analyst for a Tunisia-focused BVMT dashboard.

You are given structured market intelligence data produced by a deterministic engine.

STRICT RULES:
- Use ONLY the provided JSON data. Do not invent tickers, sectors, or numbers not present.
- Do NOT mention news, politics, macro policy, or external causes.
- Do NOT speculate beyond what the signals support.
- If coverage is thin or signals conflict (e.g. anomaly field), say so briefly in "analysis" or in "risks".
- If "intelligence" is present, treat activeAlerts, globalContext, pattern, and lowConfidenceMode as authoritative overlays on the engine summary (do not contradict them).
- Output MUST be a single JSON object only. No markdown, no code fences, no prose outside JSON.

Your job:
1. Explain what is happening (analysis: max 2 sentences, precise).
2. keyDrivers: short bullet strings grounded in the data (max 5).
3. risks: max 5 strings.
4. opportunities: max 5 strings (may be empty if none supported).
5. stance: exactly one of: bullish, bearish, neutral, defensive.
6. confidence: number 0–1 reflecting how strong the evidence is (lower if dataQuality in payload is low, anomaly is set, or intelligence.lowConfidenceMode is true).`;

function stripCodeFence(text) {
  const trimmed = (text || "").trim();
  const m = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (m) return m[1].trim();
  return trimmed;
}

function parseJsonObject(raw) {
  const s = stripCodeFence(raw);
  return JSON.parse(s);
}

function asStringArray(v, maxLen) {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => typeof x === "string" && x.trim())
    .map((x) => x.trim())
    .slice(0, maxLen);
}

function applyStructuralStance(stance, merged) {
  const intel = merged.intelligence || {};
  const bankingRiskAlert = (intel.activeAlerts || []).some(
    (a) =>
      a?.type === "risk" &&
      a?.sector === "banking" &&
      typeof a?.message === "string" &&
      /accelerating/i.test(a.message)
  );
  if (
    merged.regime === "risk_off_rotation" &&
    merged.rotationFrom === "banking" &&
    (bankingRiskAlert || merged.shortTerm === "instability increasing")
  ) {
    return "defensive";
  }
  if (merged.regime === "risk_off_rotation" && merged.rotationFrom === "banking") {
    return "defensive";
  }
  return stance;
}

function normalizeAiPayload(parsed, merged) {
  const analysis =
    typeof parsed.analysis === "string" && parsed.analysis.trim()
      ? parsed.analysis.trim()
      : merged.summary;

  let stance =
    typeof parsed.stance === "string" ? parsed.stance.trim().toLowerCase() : "neutral";
  if (!STANCES.has(stance)) stance = "neutral";
  stance = applyStructuralStance(stance, merged);

  let confidence = Number(parsed.confidence);
  if (!Number.isFinite(confidence)) confidence = merged.confidence;
  if (merged.intelligence?.lowConfidenceMode) {
    confidence = Math.min(confidence, merged.confidence);
  }
  confidence = Math.min(0.98, Math.max(0.35, confidence));

  return {
    analysis,
    keyDrivers: asStringArray(parsed.keyDrivers, 5),
    risks: asStringArray(parsed.risks, 5),
    opportunities: asStringArray(parsed.opportunities, 5),
    stance,
    confidence: Number(confidence.toFixed(2)),
  };
}

export function buildDeterministicAiFromSummary(d) {
  const intel = d.intelligence || {};
  const keyDrivers = [];
  if (d.rotation) keyDrivers.push(`Capital rotation: ${d.rotation}`);
  if (d.regime && d.regime !== "neutral") {
    keyDrivers.push(`Market regime: ${d.regime.replace(/_/g, " ")}`);
  }
  if (intel.globalContext?.label) {
    keyDrivers.push(intel.globalContext.label);
  }
  if (intel.pattern) {
    keyDrivers.push(`Pattern: ${intel.pattern.replace(/_/g, " ")}`);
  }
  keyDrivers.push(`Short-term timing: ${d.shortTerm}`);
  keyDrivers.push(`Medium-term regime: ${d.mediumTerm}`);
  keyDrivers.push(`Market tone: ${d.marketState}`);

  const risks = [];
  if (d.highRiskSector && d.highRiskSector !== "unknown") {
    risks.push(`Composite risk concentrated in ${d.highRiskSector}`);
  }
  if (d.shortTerm === "instability increasing") {
    risks.push("Short-term instability is increasing");
  }
  if (d.anomaly) {
    risks.push(`Contradiction flagged: ${d.anomaly}`);
  }
  if (d.mediumTerm === "elevated risk environment") {
    risks.push("Elevated risk environment across sectors (structural layer)");
  }
  if (intel.lowConfidenceMode) {
    risks.push("Model confidence is reduced; insights are for situational awareness");
  }

  const opportunities = [];
  if (
    d.opportunitySector &&
    d.opportunitySector !== "unknown" &&
    d.opportunitySector !== d.highRiskSector
  ) {
    opportunities.push(`Relative flow focus toward ${d.opportunitySector}`);
  }
  if (d.opportunityStrength === "strong" && d.rotationTo === "technology") {
    opportunities.push("Technology: strong inflow with clean breadth");
  }
  if (d.shortTerm === "momentum pockets building") {
    opportunities.push("Momentum pockets building (timing layer)");
  }

  let stance = "neutral";
  if (d.mediumTerm === "elevated risk environment") stance = "defensive";
  else if (d.marketState === "bearish") stance = "bearish";
  else if (d.marketState === "bullish") stance = "bullish";
  stance = applyStructuralStance(stance, d);

  const sentences = d.summary.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2);
  const analysis =
    sentences.length > 0
      ? sentences.join(" ")
      : "Signals are mixed; rely on the structured summary below.";

  return {
    analysis,
    keyDrivers: keyDrivers.slice(0, 5),
    risks: risks.slice(0, 5),
    opportunities: opportunities.slice(0, 5),
    stance,
    confidence: Number(
      Math.min(0.95, Math.max(0.35, (d.confidence || 0.5) * 0.85)).toFixed(2)
    ),
  };
}

function buildIntelligencePayload(intelligence) {
  if (!intelligence || typeof intelligence !== "object") {
    return {};
  }
  return {
    activeAlerts: Array.isArray(intelligence.alerts)
      ? intelligence.alerts.slice(0, 12)
      : [],
    globalContext: intelligence.globalContext ?? null,
    pattern: intelligence.pattern ?? null,
    patternDetail: intelligence.patternDetail ?? null,
    lowConfidenceMode: !!intelligence.lowConfidenceMode,
    signalsPresent: !!intelligence.signalsPresent,
  };
}

/**
 * Interpretation layer only: deterministicSummary from getUnifiedSummary();
 * optional intelligence from getMarketAlerts() (alerts + context).
 * Returns { payload, source: "llm" | "fallback" }.
 */
export async function runMarketSummaryAi(deterministicSummary, intelligence) {
  const intel = buildIntelligencePayload(intelligence);
  const merged = {
    ...deterministicSummary,
    intelligence: intel,
  };

  if (!process.env.GROQ_API_KEY) {
    return {
      payload: buildDeterministicAiFromSummary(merged),
      source: "fallback",
    };
  }

  try {
    const userContent = `DATA (sole source of truth):\n${JSON.stringify(
      merged,
      null,
      2
    )}\n\nReturn JSON with exactly these keys: analysis, keyDrivers, risks, opportunities, stance, confidence.`;

    const raw = await llm({
      model: "llama-3.1-8b-instant",
      temperature: 0.15,
      maxTokens: 900,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const parsed = parseJsonObject(raw);
    const payload = normalizeAiPayload(parsed, merged);
    return { payload, source: "llm" };
  } catch {
    return {
      payload: buildDeterministicAiFromSummary(merged),
      source: "fallback",
    };
  }
}
