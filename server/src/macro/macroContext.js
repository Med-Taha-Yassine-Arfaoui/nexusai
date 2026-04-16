import { computeMacroSignalsFromDb } from "./macroSignals.js";

export async function getMacroContext() {
  const { indicators, signals } = await computeMacroSignalsFromDb();

  const context = {
    regime: signals.regime || "neutral",
    pressure: signals.external_pressure ? "external_deficit" : "none",
    label: null,
  };

  if (signals.regime === "risk_off_macro") {
    context.label =
      "Macro risk-off: INS external pressure + BCT monetary tightening";
  } else if (signals.external_pressure) {
    context.label = "INS external pressure detected";
  }

  const bctConfidence = indicators.policy_rate_proxy ? "medium" : "high";

  return {
    indicators,
    signals,
    meta: { bctConfidence },
    context,
    source: "INS+BCT",
  };
}

export function applyMacroToAlerts(alerts, macro) {
  if (macro?.signals?.regime !== "risk_off_macro") {
    return alerts;
  }

  return alerts.map((a) => {
    if (a.type !== "risk" || a.lowConfidenceMode) return a;
    if (a.severity === "high") {
      return {
        ...a,
        severity: "critical",
        macroAdjusted: true,
        macroContext: macro.context?.label || "Macro risk-off adjustment",
      };
    }
    return a;
  });
}
