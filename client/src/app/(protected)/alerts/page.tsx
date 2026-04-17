"use client";
import { useEffect, useState } from "react";

type SubSignals = {
  liquidity: string;
  volatility: string;
  volume: string;
  correlation: string;
};

type MarketAlert = {
  type: string;
  message: string;
  severity: string;
  score?: number;
  sector?: string | null;
  stance?: string;
  hint?: string;
  escalated?: boolean;
  lowConfidenceMode?: boolean;
  signals?: SubSignals;
  rotation?: { from: string; to: string; strength: number; durationMinutes: number };
};

type AlertHistoryEntry = {
  message: string;
  sector: string | null;
  severity: string;
  type: string;
  stance: string;
  hint: string;
  timestamp: string;
};

type AlertHistoryStats = {
  totalBuffered: number;
  alertsLastHour: number;
  bySector: Record<string, number>;
};

type MacroContextPayload = {
  context: { regime: string; pressure: string; label: string | null };
  signals:
    | { key: string; value: number; label: string; detail?: string }[]
    | {
        regime?: string;
        external_pressure?: boolean;
        monetary_tightening?: boolean;
        monetary_easing?: boolean;
        details?: string[];
      };
  meta?: { bctConfidence?: "high" | "medium" | "low" };
  indicators?: { policy_rate?: number | null; money_market_rate?: number | null };
  source: string;
  unavailable?: boolean;
};

type MacroExplanationPayload = {
  summary: string;
  macro_regime?: string;
  confidence?: string;
  drivers?: Array<{ type: string; impact?: string; explanation?: string }>;
  implications?: string[];
  risks?: string[];
  score?: { risk: number; opportunity: number };
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState("");
  const [alertsSuppressed, setAlertsSuppressed] = useState<string | null>(null);
  const [alertsLowConfidence, setAlertsLowConfidence] = useState(false);
  const [alertsSignalsPresent, setAlertsSignalsPresent] = useState(false);
  const [globalContext, setGlobalContext] = useState<{
    code: string;
    label: string;
    dominance?: number;
  } | null>(null);
  const [alertRegime, setAlertRegime] = useState<string | null>(null);
  const [alertPattern, setAlertPattern] = useState<string | null>(null);
  const [alertPatternDetail, setAlertPatternDetail] = useState<string | null>(null);
  const [macroContext, setMacroContext] = useState<MacroContextPayload | null>(null);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryEntry[]>([]);
  const [alertHistoryStats, setAlertHistoryStats] = useState<AlertHistoryStats | null>(null);
  const [macroExplanation, setMacroExplanation] = useState<MacroExplanationPayload | string | null>(null);
  const [openMacroIndex, setOpenMacroIndex] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAlertIndex, setModalAlertIndex] = useState<number | null>(null);

  const macroSignals = !Array.isArray(macroContext?.signals) ? macroContext?.signals : null;

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;

    async function loadAlerts() {
      setAlertsLoading(true);
      setAlertsError("");

      try {
        const res = await fetch("http://localhost:5000/api/insights/alerts");
        const payload = await res.json();

        if (cancelled) return;

        if (payload?.error) {
          setAlertsError(payload.error);
          setAlerts([]);
          setAlertsSuppressed(null);
          setAlertsLowConfidence(false);
          setAlertsSignalsPresent(false);
          setGlobalContext(null);
          setAlertRegime(null);
          setAlertPattern(null);
          setAlertPatternDetail(null);
          setMacroContext(null);
          setAlertHistory([]);
          setAlertHistoryStats(null);
          return;
        }

        setAlerts(payload.alerts || []);
        setMacroExplanation(payload.macroExplanation ?? null);
        setAlertsSuppressed(payload.suppressedReason ?? null);
        setAlertsLowConfidence(!!payload.lowConfidenceMode);
        setAlertsSignalsPresent(!!payload.signalsPresent);
        setGlobalContext(payload.globalContext ?? null);
        setAlertRegime(payload.regime ?? null);
        setAlertPattern(payload.pattern ?? null);
        setAlertPatternDetail(payload.patternDetail ?? null);

        if (payload.macroUi) {
          setMacroContext({
            context: payload.macro?.context || { regime: payload.regime || "neutral", pressure: "none", label: null },
            signals: {
              regime: payload.macro?.signals?.regime || payload.macroUi.monetaryPolicy?.toLowerCase() || "neutral",
              external_pressure: payload.macroUi.externalPressure === "YES",
              monetary_tightening: payload.macroUi.monetaryPolicy === "Tightening",
              monetary_easing: payload.macroUi.monetaryPolicy === "Easing",
              details: payload.macro?.signals?.details || [],
            },
            meta: { bctConfidence: payload.macroUi.bctConfidence ?? payload.macro?.meta?.bctConfidence },
            indicators: {
              policy_rate: payload.macroUi.policyRate ?? payload.macro?.indicators?.policy_rate,
              money_market_rate: payload.macroUi.moneyMarketRate ?? payload.macro?.indicators?.money_market_rate,
            },
            source: payload.macro?.source || "INS+BCT",
            unavailable: payload.macro?.unavailable ?? false,
          });
        } else {
          setMacroContext(payload.macro ?? null);
        }

        setAlertHistory(payload.history || []);
        setAlertHistoryStats(payload.historyStats ?? null);
      } catch (error) {
        if (!cancelled) {
          setAlertsError("Failed to load alerts.");
          setAlerts([]);
          setMacroContext(null);
          setAlertHistory([]);
          setAlertHistoryStats(null);
        }
      } finally {
        if (!cancelled) setAlertsLoading(false);
      }
    }

    loadAlerts();

    try {
      ws = new WebSocket("ws://localhost:5000");
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          if (message.type === "market_alerts") {
            loadAlerts();
          }
        } catch {
          // ignore invalid websocket payloads
        }
      };
    } catch {
      // optional websocket connection failed
    }

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, []);

  return (
    <div className="p-8 text-white min-h-screen bg-slate-950">
      <h1 className="text-3xl font-bold text-amber-400 mb-8">Live Alerts</h1>

      <div className="bg-slate-900 rounded-xl border border-amber-500/25 p-4 mb-6">
        {globalContext && (
          <div className="mb-3 rounded border border-fuchsia-500/40 bg-fuchsia-950/30 px-3 py-2 text-sm text-fuchsia-100">
            <span className="font-semibold">Global: </span>
            {globalContext.label}
            {typeof globalContext.dominance === "number" && (
              <span className="text-fuchsia-200/80"> · {Math.round(globalContext.dominance * 100)}% banking share</span>
            )}
          </div>
        )}

        {macroContext?.context?.label && (
          <div
            className={`mb-3 rounded border px-3 py-2 text-xs ${
              macroContext.context.regime === "risk_off_macro"
                ? "border-orange-500/40 bg-orange-950/25 text-orange-100"
                : "border-slate-600/50 bg-slate-950/60 text-slate-300"
            }`}
          >
            <span className="font-semibold text-slate-400">Macro (INS): </span>
            {macroContext.context.label}
            {Array.isArray(macroContext.signals) && macroContext.signals?.[0]?.detail && (
              <span className="text-slate-500 block mt-0.5 font-mono text-[10px]">
                {macroContext.signals[0].detail}
              </span>
            )}
            {Array.isArray(macroSignals?.details) && macroSignals.details.length > 0 && (
              <span className="text-slate-500 block mt-0.5 font-mono text-[10px]">
                {macroSignals.details[0]}
              </span>
            )}
            {macroSignals && (
              <div className="mt-1 text-[11px] text-slate-300 space-y-0.5">
                <div>
                  External Pressure: <span className="font-semibold">{macroSignals.external_pressure ? "YES" : "NO"}</span>
                </div>
                <div>
                  Monetary Policy: <span className="font-semibold">
                    {macroSignals.monetary_tightening
                      ? "Tightening"
                      : macroSignals.monetary_easing
                        ? "Easing"
                        : "Neutral"}
                  </span>
                </div>
                <div>
                  Regime: <span className="font-semibold">{macroSignals.regime?.replace(/_/g, " ") || "neutral"}</span>
                  {macroContext.meta?.bctConfidence && (
                    <span className="text-slate-500"> · BCT confidence: {macroContext.meta.bctConfidence}</span>
                  )}
                </div>
              </div>
            )}
            {macroContext.unavailable && (
              <span className="text-slate-500"> · feed unavailable</span>
            )}
          </div>
        )}

        {macroExplanation && typeof macroExplanation !== "string" && (
          <div className="mb-4 rounded-lg border px-4 py-3 bg-slate-900/70 border-indigo-600/30">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-400 font-semibold">Macro Insight</div>
                <div className="mt-1 text-white font-bold text-lg">{macroExplanation.summary}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const regime = String(macroExplanation.macro_regime || "");
                    const colorMap: Record<string, string> = {
                      RISK_OFF: "bg-red-500",
                      RISK_ON: "bg-green-500",
                      NEUTRAL: "bg-yellow-500",
                    };
                    return (
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${colorMap[regime] || "bg-slate-500"} text-white`}>
                        <span className="w-2 h-2 rounded-full" />
                        {regime.replace(/_/g, " ")}
                      </span>
                    );
                  })()}
                </div>
                <div className="text-sm text-slate-300">
                  <div className="text-xs text-slate-400">Confidence</div>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const confidence = (macroExplanation.confidence || "LOW").toUpperCase();
                      if (confidence === "HIGH") return <span className="text-green-400">●●●</span>;
                      if (confidence === "MEDIUM") return <span className="text-yellow-400">●●○</span>;
                      return <span className="text-red-400">●○○</span>;
                    })()}
                    <span className="ml-2 text-slate-400 text-xs">{macroExplanation.confidence}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                <div className="text-slate-400 text-xs font-semibold">Drivers</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.isArray(macroExplanation.drivers) && macroExplanation.drivers.length ? (
                    macroExplanation.drivers.map((driver, idx) => (
                      <div key={idx} className="rounded border border-slate-700/60 bg-slate-950/40 p-3">
                        <div className="flex items-center gap-2">
                          <div className="text-xl">
                            {driver.type === "RATES"
                              ? "📉"
                              : driver.type === "INFLATION"
                                ? "🌡️"
                                : driver.type === "EXTERNAL"
                                  ? "🌍"
                                  : "💧"}
                          </div>
                          <div>
                            <div className="font-semibold">{driver.type} <span className="text-sm text-slate-400">({driver.impact})</span></div>
                            <div className="text-slate-300 text-sm mt-1">{driver.explanation}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500">No explicit drivers available.</div>
                  )}
                </div>

                <div className="mt-3">
                  <div className="text-slate-400 text-xs font-semibold">What this means</div>
                  {Array.isArray(macroExplanation.implications) && macroExplanation.implications.length ? (
                    <ul className="list-disc pl-5 text-slate-300 mt-1">
                      {macroExplanation.implications.map((implication, idx) => (
                        <li key={idx}>{implication}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-slate-500 mt-1">No implications provided.</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-xs font-semibold">Risks</div>
                {Array.isArray(macroExplanation.risks) && macroExplanation.risks.length ? (
                  <ul className="list-disc pl-5 text-amber-200 mt-1">
                    {macroExplanation.risks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-slate-500 mt-1">No specific risks listed.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {(alertRegime && alertRegime !== "neutral") || alertPattern ? (
          <p className="text-xs text-amber-100/90 mb-2">
            {alertRegime && alertRegime !== "neutral" && (
              <>
                Regime: <span className="font-mono">{alertRegime.replace(/_/g, " ")}</span>
              </>
            )}
            {alertPattern && (
              <>
                {alertRegime && alertRegime !== "neutral" ? " · " : ""}
                Pattern: <span className="font-mono">{alertPattern.replace(/_/g, " ")}</span>
              </>
            )}
            {alertPatternDetail && (
              <span className="text-slate-400"> — {alertPatternDetail}</span>
            )}
          </p>
        ) : null}

        {alertsLoading && <p className="text-slate-400 text-sm">Checking conditions...</p>}
        {alertsError && <p className="text-red-400 text-sm">{alertsError}</p>}
        {alertsSuppressed === "very_low_confidence" && alertsSignalsPresent && (
          <p className="text-amber-200/90 text-sm mb-2 rounded border border-amber-600/40 bg-amber-950/25 px-2 py-1.5">
            Signals are present but summary confidence is very low (&lt;40%). Alerts stay hidden; use the deterministic summary and risk panels for context.
          </p>
        )}
        {alertsLowConfidence && (
          <p className="text-slate-400 text-sm mb-2">
            Reduced-confidence mode (40–60%): alerts shown as <span className="text-slate-200 font-medium">low</span> severity for situational awareness.
          </p>
        )}
        {!alertsLoading && !alertsError && alerts.length === 0 && alertsSuppressed !== "very_low_confidence" && (
          <p className="text-slate-500 text-sm">
            {alertsSuppressed
              ? `No alerts emitted (${alertsSuppressed.replace(/_/g, " ")}).`
              : "No actionable alerts right now. If risk panels show stress, check summary confidence or wait for the next evaluation."}
          </p>
        )}

        {alerts.length > 0 && (
          <ul className="space-y-3">
            {alerts.map((alert, index) => {
              const tone =
                alert.severity === "critical"
                  ? "border-fuchsia-500/50 bg-fuchsia-950/25"
                  : alert.severity === "high"
                    ? "border-red-500/40 bg-red-950/25"
                    : alert.severity === "low"
                      ? "border-slate-600/50 bg-slate-900/80"
                      : "border-amber-600/35 bg-amber-950/20";
              const sevColor =
                alert.severity === "critical"
                  ? "text-fuchsia-200"
                  : alert.severity === "high"
                    ? "text-red-300"
                    : alert.severity === "low"
                      ? "text-slate-400"
                      : "text-amber-200";

              return (
                <li key={`${alert.type}-${alert.message}-${index}`} className={`rounded border px-3 py-2 text-sm ${tone}`}>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <strong className={`uppercase ${sevColor}`}>{alert.severity}</strong>
                    {alert.stance && (
                      <strong className="text-slate-100 uppercase tracking-wide">{alert.stance}</strong>
                    )}
                    <span className="text-slate-200">{alert.message}</span>
                    {typeof alert.score === "number" && (
                      <span className="text-slate-500 text-xs">score {alert.score.toFixed(2)}</span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => {
                          setOpenMacroIndex(openMacroIndex === index ? null : index);
                          setModalAlertIndex(index);
                          setModalOpen(true);
                        }}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded text-white"
                      >
                        Explanation
                      </button>
                    </div>
                  </div>
                  {alert.hint && <p className="text-slate-400 text-xs mt-1 pl-0.5">{alert.hint}</p>}
                  {openMacroIndex === index && macroExplanation && (
                    <div className="mt-2 rounded border border-slate-700/60 bg-slate-900/60 p-2 text-slate-300 text-sm">
                      <strong className="text-slate-200 text-[13px]">Macro explanation:</strong>
                      {typeof macroExplanation === "string" ? (
                        <p className="mt-1">{macroExplanation}</p>
                      ) : (
                        <div className="mt-1 space-y-2">
                          <p className="font-semibold">{macroExplanation.summary}</p>
                          <div>
                            <span className="text-slate-400 text-xs">Regime: </span>
                            <span className="font-mono">{macroExplanation.macro_regime}</span>
                            <span className="text-slate-500"> · Confidence: {macroExplanation.confidence}</span>
                          </div>
                          {Array.isArray(macroExplanation.drivers) && macroExplanation.drivers.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-xs mb-1">Drivers</p>
                              <ul className="list-disc pl-5 text-slate-300 text-sm">
                                {macroExplanation.drivers.map((driver, idx) => (
                                  <li key={idx}>{driver.type} · {driver.impact} — {driver.explanation}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(macroExplanation.implications) && macroExplanation.implications.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-xs mb-1">Implications</p>
                              <ul className="list-disc pl-5 text-slate-300 text-sm">
                                {macroExplanation.implications.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(macroExplanation.risks) && macroExplanation.risks.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-xs mb-1">Risks</p>
                              <ul className="list-disc pl-5 text-amber-200 text-sm">
                                {macroExplanation.risks.map((risk, idx) => (
                                  <li key={idx}>{risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {alert.signals && alert.type === "risk" && (
                    <p className="text-slate-500 text-[11px] mt-1 font-mono">
                      liq {alert.signals.liquidity} · vol {alert.signals.volatility} · volu {alert.signals.volume} · corr {alert.signals.correlation}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {alertHistory.length > 0 && (
          <details className="mt-3 text-xs border border-slate-700 rounded p-2 bg-slate-950/50">
            <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
              Recent alert log ({alertHistory.length})
            </summary>
            <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto text-slate-500">
              {alertHistory.slice(0, 15).map((history, idx) => (
                <li key={`${history.timestamp}-${idx}`} className="border-b border-slate-800/80 pb-1">
                  <span className="text-slate-600">{new Date(history.timestamp).toLocaleString()}</span>{" "}
                  <span className="text-slate-400 uppercase">{history.severity}</span> {history.message}
                  {history.sector && <span className="text-slate-600"> · {history.sector}</span>}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {modalOpen && modalAlertIndex !== null && alerts[modalAlertIndex] && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg w-11/12 max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Alert explanation — Macro context</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-sm text-slate-300">
                  <div className="text-xs text-slate-400 font-semibold">Alert</div>
                  <div className="mt-1 rounded border border-slate-800/60 bg-slate-950/40 p-3 text-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-white">{alerts[modalAlertIndex].message}</div>
                        <div className="text-slate-400 text-xs mt-1">
                          {alerts[modalAlertIndex].type} · {alerts[modalAlertIndex].sector || "—"}
                        </div>
                        {alerts[modalAlertIndex].hint && (
                          <div className="text-slate-500 text-xs mt-2">{alerts[modalAlertIndex].hint}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Severity</div>
                        <div className="font-semibold">{alerts[modalAlertIndex].severity}</div>
                        {typeof alerts[modalAlertIndex].score === "number" && (
                          <div className="text-slate-400 text-xs mt-2">
                            Score {Math.round((alerts[modalAlertIndex].score || 0) * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-semibold">Macro Explanation</div>
                <div className="mt-1 rounded border border-slate-800/60 bg-slate-950/40 p-3 text-sm text-slate-300">
                  {typeof macroExplanation === "string" || !macroExplanation ? (
                    <pre className="whitespace-pre-wrap text-xs text-slate-200">
                      {macroExplanation || "No macro explanation available."}
                    </pre>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="font-semibold text-white">{macroExplanation.summary}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm"></span>
                          <div className="text-xs text-slate-400">
                            Confidence: <span className="font-semibold text-slate-200">{macroExplanation.confidence}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-semibold">Drivers</div>
                        <div className="mt-2 space-y-2">
                          {Array.isArray(macroExplanation.drivers) && macroExplanation.drivers.length ? (
                            macroExplanation.drivers.map((driver, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="text-xl">
                                  {driver.type === "RATES"
                                    ? "📉"
                                    : driver.type === "INFLATION"
                                      ? "🌡️"
                                      : driver.type === "EXTERNAL"
                                        ? "🌍"
                                        : "💧"}
                                </div>
                                <div>
                                  <div className="font-semibold">
                                    {driver.type} <span className="text-slate-400 text-xs">{driver.impact}</span>
                                  </div>
                                  <div className="text-slate-300 text-sm mt-1">{driver.explanation}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500">No drivers provided.</div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs text-slate-400 font-semibold">Implications</div>
                          {Array.isArray(macroExplanation.implications) && macroExplanation.implications.length ? (
                            <ul className="list-disc pl-5 text-slate-300 mt-1">
                              {macroExplanation.implications.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-slate-500 mt-1">No implications listed.</div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-semibold">Risks</div>
                          {Array.isArray(macroExplanation.risks) && macroExplanation.risks.length ? (
                            <ul className="list-disc pl-5 text-amber-200 mt-1">
                              {macroExplanation.risks.map((risk, idx) => (
                                <li key={idx}>{risk}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-slate-500 mt-1">No risks listed.</div>
                          )}
                        </div>
                      </div>
                      {macroExplanation.score && (
                        <div className="mt-3">
                          <div className="text-xs text-slate-400 font-semibold">Scores</div>
                          <div className="mt-2 space-y-2">
                            <div>
                              <div className="text-slate-300 text-sm">Risk: <span className="font-semibold">{macroExplanation.score.risk}</span></div>
                              <div className="w-full bg-slate-800 rounded h-2 mt-1">
                                <div className="bg-red-500 h-2 rounded" style={{ width: `${macroExplanation.score.risk}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-300 text-sm">Opportunity: <span className="font-semibold">{macroExplanation.score.opportunity}</span></div>
                              <div className="w-full bg-slate-800 rounded h-2 mt-1">
                                <div className="bg-emerald-500 h-2 rounded" style={{ width: `${macroExplanation.score.opportunity}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
