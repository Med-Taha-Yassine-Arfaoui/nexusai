"use client";
import { useEffect, useState } from "react";

type Stock = {
  id: number;
  mnemo: string;
  last_trade_price: number;
  quantity: number;
  var_prev_close: number;
};

type InsightResponse = {
  ticker: string;
  price: number;
  change: number;
  volume: number;
  signals: {
    trend: string;
    volume: string;
    marketTrend: string;
    sector: string;
    sectorTrend: string;
    averageVolume: number;
    volatility: number;
    momentum: number;
  };
  explanation: string;
  confidence: number;
};

type CapitalFlowSector = {
  sector: string;
  totalVolume: number;
  avgChange: number;
  flowScore: number;
  direction: string;
  count: number;
};

type CapitalFlowResponse = {
  inflow: string;
  outflow: string;
  details: CapitalFlowSector[];
  explanation: string;
  confidence: number;
};

type RiskSignal = {
  sector: string;
  riskScore: number;
  state: string;
  pattern: string;
  timing: string;
  volatility: number;
  negativeRatio: number;
  volumeSpikeRatio: number;
  flowScore: number;
  avgChange: number;
  volumeAccel: number;
  volatilityAccel: number;
  negativeAccel: number;
};

type RiskResponse = {
  highRiskSector: string;
  signals: RiskSignal[];
  explanation: string;
  confidence: number;
};

type SummaryResponse = {
  rotation: string | null;
  rotationFrom?: string | null;
  rotationTo?: string | null;
  regime?: string;
  relativeRotationStrength?: number | null;
  opportunityStrength?: string | null;
  highRiskSector: string;
  opportunitySector: string;
  marketState: string;
  shortTerm: string;
  mediumTerm: string;
  anomaly: string | null;
  confidence: number;
  confidenceBreakdown: {
    flow: number;
    risk: number;
    dataQuality: number;
  };
  summary: string;
  dataQualityMultiplier: number;
};

type AiSummaryPayload = {
  analysis: string;
  keyDrivers: string[];
  risks: string[];
  opportunities: string[];
  stance: string;
  confidence: number;
};

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

export default function FinancePage() {
  const [data, setData] = useState<{
    stocks: Stock[];
    gainers: Stock[];
    losers: Stock[];
    active: Stock[];
  }>({
    stocks: [],
    gainers: [],
    losers: [],
    active: [],
  });
  const [tickerInput, setTickerInput] = useState("");
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");
  const [flow, setFlow] = useState<CapitalFlowResponse | null>(null);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowError, setFlowError] = useState("");
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState("");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [aiInsight, setAiInsight] = useState<AiSummaryPayload | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);
  const [aiDetailsOpen, setAiDetailsOpen] = useState(false);
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
  const [alertHistory, setAlertHistory] = useState<AlertHistoryEntry[]>([]);
  const [alertHistoryStats, setAlertHistoryStats] = useState<AlertHistoryStats | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/market")
      .then((res) => res.json())
      .then((res) => {
        setData({
          stocks: res.stocks || [],
          gainers: res.gainers || [],
          losers: res.losers || [],
          active: res.active || [],
        });
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setData({
          stocks: [],
          gainers: [],
          losers: [],
          active: [],
        });
      });

    setSummaryLoading(true);
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/insights/summary/ai");
        const payload = await res.json();

        if (!res.ok || payload?.error || !payload?.deterministic) {
          setAiInsight(null);
          setAiSource(null);
          const r2 = await fetch("http://localhost:5000/api/insights/summary");
          const p2 = await r2.json();
          if (!r2.ok || p2?.error) {
            setSummaryError(p2?.error || payload?.error || "Summary unavailable.");
            setSummary(null);
            return;
          }
          setSummary(p2);
          setSummaryError("");
          return;
        }

        setSummary(payload.deterministic);
        setAiInsight(payload.ai);
        setAiSource(payload.aiSource || null);
        setSummaryError("");
      } catch (err) {
        console.error("Summary fetch error:", err);
        setSummaryError("Failed to load market summary.");
        setSummary(null);
        setAiInsight(null);
        setAiSource(null);
      } finally {
        setSummaryLoading(false);
      }
    })();

    setFlowLoading(true);
    fetch("http://localhost:5000/api/insights/capital-flow")
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.error) {
          setFlowError(payload.error);
          setFlow(null);
          return;
        }
        setFlow(payload);
      })
      .catch((err) => {
        console.error("Capital flow fetch error:", err);
        setFlowError("Failed to load capital flow insights.");
        setFlow(null);
      })
      .finally(() => {
        setFlowLoading(false);
      });

    setRiskLoading(true);
    fetch("http://localhost:5000/api/insights/risk")
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.error) {
          setRiskError(payload.error);
          setRisk(null);
          return;
        }
        setRisk(payload);
      })
      .catch((err) => {
        console.error("Risk insights fetch error:", err);
        setRiskError("Failed to load risk insights.");
        setRisk(null);
      })
      .finally(() => {
        setRiskLoading(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;

    async function loadAlerts() {
      setAlertsLoading(true);
      setAlertsError("");
      try {
        const r = await fetch("http://localhost:5000/api/insights/alerts");
        const j = await r.json();
        if (cancelled) return;
        if (j?.error) {
          setAlertsError(j.error);
          setAlerts([]);
          setAlertsSuppressed(null);
          setAlertsLowConfidence(false);
          setAlertsSignalsPresent(false);
          setGlobalContext(null);
          setAlertRegime(null);
          setAlertPattern(null);
          setAlertPatternDetail(null);
          setAlertHistory([]);
          setAlertHistoryStats(null);
          return;
        }
        setAlerts(j.alerts || []);
        setAlertsSuppressed(j.suppressedReason ?? null);
        setAlertsLowConfidence(!!j.lowConfidenceMode);
        setAlertsSignalsPresent(!!j.signalsPresent);
        setGlobalContext(j.globalContext ?? null);
        setAlertRegime(j.regime ?? null);
        setAlertPattern(j.pattern ?? null);
        setAlertPatternDetail(j.patternDetail ?? null);
        setAlertHistory(j.history || []);
        setAlertHistoryStats(j.historyStats ?? null);
      } catch {
        if (!cancelled) {
          setAlertsError("Failed to load alerts.");
          setAlerts([]);
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
      ws.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data as string);
          if (d.type === "market_alerts") {
            loadAlerts();
          }
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* optional WS */
    }

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, []);

  async function onAnalyze() {
    const ticker = tickerInput.trim().toUpperCase();
    if (!ticker) {
      setInsightError("Please enter a ticker (example: ATB).");
      setInsight(null);
      return;
    }

    setInsightLoading(true);
    setInsightError("");

    try {
      const res = await fetch(`http://localhost:5000/api/insights/explain/${ticker}`);
      const payload = await res.json();

      if (!res.ok) {
        setInsightError(payload?.error || "Unable to analyze this ticker.");
        setInsight(null);
        return;
      }

      setInsight(payload);
    } catch (err) {
      console.error("Insight fetch error:", err);
      setInsightError("Failed to reach backend insights endpoint.");
      setInsight(null);
    } finally {
      setInsightLoading(false);
    }
  }

  if (!data.stocks.length) {
    return <div className="p-8 text-white">Loading market data...</div>;
  }

  return (
    <div className="p-8 text-white min-h-screen bg-slate-950">
      <h1 className="text-3xl font-bold text-blue-400 mb-8">BVMT Market Dashboard</h1>

      <div className="bg-slate-900 rounded-xl border border-amber-500/25 p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2 text-amber-200">Live alerts</h2>
        {globalContext && (
          <div className="mb-3 rounded border border-fuchsia-500/40 bg-fuchsia-950/30 px-3 py-2 text-sm text-fuchsia-100">
            <span className="font-semibold">Global: </span>
            {globalContext.label}
            {typeof globalContext.dominance === "number" && (
              <span className="text-fuchsia-200/80"> · {Math.round(globalContext.dominance * 100)}% banking share</span>
            )}
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
        {risk && risk.signals.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 text-[11px] text-slate-300">
            <span className="text-slate-500 w-full uppercase tracking-wide">Sector heat</span>
            {risk.signals.map((s) => {
              const dot =
                s.state === "High Risk"
                  ? "bg-red-500"
                  : s.state === "Elevated"
                    ? "bg-amber-400"
                    : "bg-emerald-500";
              return (
                <span
                  key={s.sector}
                  className="inline-flex items-center gap-1.5 rounded border border-slate-700/80 bg-slate-950/60 px-2 py-0.5"
                >
                  <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
                  <span className="capitalize">{s.sector}</span>
                  <span className="text-slate-500">·</span>
                  <span>{s.state}</span>
                </span>
              );
            })}
          </div>
        )}
        {alertHistoryStats && (
          <p className="text-slate-500 text-xs mb-2">
            {alertHistoryStats.alertsLastHour} alert record{alertHistoryStats.alertsLastHour === 1 ? "" : "s"} in the last hour
            {alertHistoryStats.totalBuffered ? ` · ${alertHistoryStats.totalBuffered} buffered` : ""}
          </p>
        )}

        {alerts.length > 0 && (
          <ul className="space-y-3">
            {alerts.map((a, i) => {
              const tone =
                a.severity === "critical"
                  ? "border-fuchsia-500/50 bg-fuchsia-950/25"
                  : a.severity === "high"
                    ? "border-red-500/40 bg-red-950/25"
                    : a.severity === "low"
                      ? "border-slate-600/50 bg-slate-900/80"
                      : "border-amber-600/35 bg-amber-950/20";
              const sevColor =
                a.severity === "critical"
                  ? "text-fuchsia-200"
                  : a.severity === "high"
                    ? "text-red-300"
                    : a.severity === "low"
                      ? "text-slate-400"
                      : "text-amber-200";
              return (
                <li
                  key={`${a.type}-${a.message}-${i}`}
                  className={`rounded border px-3 py-2 text-sm ${tone}`}
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <strong className={`uppercase ${sevColor}`}>{a.severity}</strong>
                    {a.stance && (
                      <strong className="text-slate-100 uppercase tracking-wide">{a.stance}</strong>
                    )}
                    <span className="text-slate-200">{a.message}</span>
                    {typeof a.score === "number" && (
                      <span className="text-slate-500 text-xs ml-auto">score {a.score.toFixed(2)}</span>
                    )}
                  </div>
                  {a.hint && <p className="text-slate-400 text-xs mt-1 pl-0.5">{a.hint}</p>}
                  {a.signals && a.type === "risk" && (
                    <p className="text-slate-500 text-[11px] mt-1 font-mono">
                      liq {a.signals.liquidity} · vol {a.signals.volatility} · volu {a.signals.volume} · corr {a.signals.correlation}
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
              {alertHistory.slice(0, 15).map((h, i) => (
                <li key={`${h.timestamp}-${i}`} className="border-b border-slate-800/80 pb-1">
                  <span className="text-slate-600">
                    {new Date(h.timestamp).toLocaleString()}
                  </span>{" "}
                  <span className="text-slate-400 uppercase">{h.severity}</span> {h.message}
                  {h.sector && <span className="text-slate-600"> · {h.sector}</span>}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 rounded-xl border border-indigo-500/30 p-4 mb-8 shadow-lg shadow-indigo-950/20">
        <h2 className="text-lg font-semibold mb-2 text-indigo-200">Market Intelligence</h2>
        {summaryLoading && <p className="text-slate-400 text-sm">Synthesizing flow, risk, and timing...</p>}
        {summaryError && <p className="text-amber-400 text-sm">{summaryError}</p>}
        {summary && (
          <div className="space-y-3">
            {aiInsight && (
              <div className="rounded-lg border border-violet-500/35 bg-violet-950/20 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-violet-200 text-sm font-semibold">AI insight</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full border border-violet-500/50 text-violet-200 capitalize">
                      {aiInsight.stance}
                    </span>
                    <span className="px-2 py-0.5 rounded-full border border-slate-600 text-slate-300">
                      AI conf: {Math.round(aiInsight.confidence * 100)}%
                    </span>
                    {aiSource && (
                      <span className="px-2 py-0.5 rounded-full border border-slate-600 text-slate-400">
                        {aiSource === "llm" ? "Model" : "Rule fallback"}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-50 text-base md:text-lg font-medium leading-snug">
                  {aiInsight.analysis}
                </p>
                <button
                  type="button"
                  onClick={() => setAiDetailsOpen((o) => !o)}
                  className="text-xs text-violet-300 hover:text-violet-100 underline-offset-2 hover:underline"
                >
                  {aiDetailsOpen ? "Hide structured detail" : "Key drivers, risks, opportunities"}
                </button>
                {aiDetailsOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <p className="text-slate-500 mb-1 font-medium">Key drivers</p>
                      <ul className="list-disc pl-4 text-slate-300 space-y-1">
                        {aiInsight.keyDrivers.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1 font-medium">Risks</p>
                      <ul className="list-disc pl-4 text-amber-200/90 space-y-1">
                        {aiInsight.risks.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1 font-medium">Opportunities</p>
                      <ul className="list-disc pl-4 text-emerald-200/90 space-y-1">
                        {aiInsight.opportunities.length ? (
                          aiInsight.opportunities.map((x, i) => <li key={i}>{x}</li>)
                        ) : (
                          <li className="text-slate-500 list-none pl-0">None highlighted by signals.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-slate-500 text-xs mb-1 font-medium">Engine summary (deterministic)</p>
              <p className="text-slate-100 leading-relaxed text-base md:text-lg font-medium">
                {summary.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {summary.regime && summary.regime !== "neutral" && (
                <span className="px-2 py-1 rounded border border-rose-600/45 bg-rose-950/35 text-rose-100">
                  Regime: {summary.regime.replace(/_/g, " ")}
                </span>
              )}
              {typeof summary.relativeRotationStrength === "number" && (
                <span className="px-2 py-1 rounded border border-slate-600 bg-slate-950 text-slate-300">
                  Rotation strength (tech vs |bank flow|): {summary.relativeRotationStrength}x
                </span>
              )}
              {summary.opportunityStrength === "strong" && (
                <span className="px-2 py-1 rounded border border-teal-600/50 bg-teal-950/40 text-teal-100">
                  Tech opportunity: strong (flow + breadth)
                </span>
              )}
              <span className="px-2 py-1 rounded border border-emerald-600/50 bg-emerald-950/40 text-emerald-200">
                Rotation: {summary.rotation || "none"}
              </span>
              <span className="px-2 py-1 rounded border border-red-600/50 bg-red-950/30 text-red-200">
                Risk: {summary.highRiskSector}
              </span>
              <span className="px-2 py-1 rounded border border-cyan-600/50 bg-cyan-950/30 text-cyan-200">
                Opportunity: {summary.opportunitySector}
              </span>
              <span className="px-2 py-1 rounded border border-violet-500/50 bg-violet-950/30 text-violet-200">
                Short-term: {summary.shortTerm}
              </span>
              <span className="px-2 py-1 rounded border border-slate-600 bg-slate-950 text-slate-300">
                Medium-term: {summary.mediumTerm}
              </span>
              <span className="px-2 py-1 rounded border border-slate-600 bg-slate-950 text-slate-300">
                Market: {summary.marketState}
              </span>
            </div>

            {summary.anomaly && (
              <div className="px-3 py-2 rounded border border-amber-600/40 bg-amber-950/30 text-amber-200 text-sm">
                Anomaly: {summary.anomaly}
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full border border-indigo-500/40 bg-indigo-950/50 text-indigo-200">
                Confidence: {Math.round(summary.confidence * 100)}%
              </span>
              <span className="px-2 py-1 rounded-full border border-blue-500/40 bg-blue-950/40 text-blue-200">
                Flow conf: {Math.round(summary.confidenceBreakdown.flow * 100)}%
              </span>
              <span className="px-2 py-1 rounded-full border border-fuchsia-500/40 bg-fuchsia-950/30 text-fuchsia-200">
                Risk conf: {Math.round(summary.confidenceBreakdown.risk * 100)}%
              </span>
              <span className="px-2 py-1 rounded-full border border-amber-600/40 bg-amber-950/30 text-amber-200">
                Data quality: {Math.round(summary.confidenceBreakdown.dataQuality * 100)}%
              </span>
              {summary.dataQualityMultiplier < 1 && (
                <span className="px-2 py-1 rounded-full border border-amber-600/40 bg-amber-950/30 text-amber-200">
                  Degraded quality mode
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">Market Intelligence Engine</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            placeholder="Enter ticker (e.g. ATB)"
            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white w-full sm:w-64"
          />
          <button
            onClick={onAnalyze}
            disabled={insightLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-4 py-2 rounded font-semibold"
          >
            {insightLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {insightError && <p className="text-red-400">{insightError}</p>}

        {insight && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs mb-1">Ticker</p>
              <p className="font-bold text-lg">{insight.ticker}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs mb-1">Price / Change</p>
              <p className="font-semibold">
                {insight.price?.toFixed(3)} ({insight.change >= 0 ? "+" : ""}
                {insight.change?.toFixed(2)}%)
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs mb-1">Volume</p>
              <p className="font-semibold">{Math.round(insight.volume).toLocaleString()}</p>
            </div>

            <div className="md:col-span-3 bg-slate-950 border border-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs mb-1">Signals</p>
              <div className="flex flex-wrap gap-2">
                <SignalBadge label="Trend" value={insight.signals.trend} />
                <SignalBadge label="Volume" value={insight.signals.volume} />
                <SignalBadge label="Market" value={insight.signals.marketTrend} />
                <SignalBadge label="Sector" value={insight.signals.sector} />
                <SignalBadge label="Sector Trend" value={insight.signals.sectorTrend} />
              </div>
            </div>

            <div className="md:col-span-3 bg-slate-950 border border-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs mb-2">Confidence</p>
              <div className="w-full h-2 bg-slate-800 rounded">
                <div
                  className="h-2 rounded bg-gradient-to-r from-blue-500 to-emerald-400"
                  style={{ width: `${Math.round(insight.confidence * 100)}%` }}
                />
              </div>
              <p className="text-sm text-slate-300 mt-2">
                {Math.round(insight.confidence * 100)}% confidence
              </p>
            </div>

            <div className="md:col-span-3 bg-slate-950 border border-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs mb-1">Breakdown</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <p>Average Volume: <span className="text-blue-300">{insight.signals.averageVolume.toLocaleString()}</span></p>
                <p>Volatility: <span className="text-blue-300">{insight.signals.volatility.toFixed(2)}</span></p>
                <p>Momentum: <span className="text-blue-300">{insight.signals.momentum.toFixed(3)}</span></p>
              </div>
            </div>

            <div className="md:col-span-3 bg-blue-950/30 border border-blue-800 rounded p-3">
              <p className="text-slate-300 text-xs mb-1">Explanation</p>
              <p className="text-blue-100">{insight.explanation}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">Capital Flow</h2>

        {flowLoading && <p className="text-slate-300">Loading capital flow...</p>}
        {flowError && <p className="text-red-400">{flowError}</p>}

        {flow && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Top Inflow</p>
                <p className="text-emerald-400 font-bold text-lg">{flow.inflow}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Top Outflow</p>
                <p className="text-red-400 font-bold text-lg">{flow.outflow}</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs mb-2">Capital Flow Confidence</p>
              <div className="w-full h-2 bg-slate-800 rounded">
                <div
                  className="h-2 rounded bg-gradient-to-r from-indigo-500 to-cyan-400"
                  style={{ width: `${Math.round(flow.confidence * 100)}%` }}
                />
              </div>
              <p className="text-sm text-slate-300 mt-2">{Math.round(flow.confidence * 100)}%</p>
            </div>

            <div className="bg-indigo-950/30 border border-indigo-800 rounded p-3">
              <p className="text-slate-300 text-xs mb-1">Explanation</p>
              <p className="text-indigo-100">{flow.explanation}</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs mb-2">Sector Ranking</p>
              <div className="space-y-2">
                {flow.details.map((sector) => (
                  <div
                    key={sector.sector}
                    className="flex flex-wrap items-center justify-between text-sm border-b border-slate-800 pb-2"
                  >
                    <span className="font-semibold">{sector.sector}</span>
                    <span className={sector.flowScore >= 0 ? "text-emerald-400" : "text-red-400"}>
                      Flow Score: {sector.flowScore.toLocaleString()}
                    </span>
                    <span className="text-slate-300">Avg Change: {sector.avgChange.toFixed(2)}%</span>
                    <span className="text-slate-400">Volume: {Math.round(sector.totalVolume).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-xl border border-red-900/40 p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-red-200">Risk Monitor</h2>

        {riskLoading && <p className="text-slate-300">Loading risk analysis...</p>}
        {riskError && <p className="text-red-400">{riskError}</p>}

        {risk && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-red-900/50 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Highest-risk sector</p>
                <p className="text-red-400 font-bold text-lg">{risk.highRiskSector}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded p-3">
                <p className="text-slate-400 text-xs mb-2">Risk confidence</p>
                <div className="w-full h-2 bg-slate-800 rounded">
                  <div
                    className="h-2 rounded bg-gradient-to-r from-red-600 to-amber-500"
                    style={{ width: `${Math.round(risk.confidence * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-slate-300 mt-2">{Math.round(risk.confidence * 100)}%</p>
              </div>
            </div>

            <div className="bg-red-950/20 border border-red-900/40 rounded p-3">
              <p className="text-slate-300 text-xs mb-1">Assessment</p>
              <p className="text-red-100/95">{risk.explanation}</p>
            </div>

            <div className="space-y-3">
              {risk.signals.map((s) => (
                <div
                  key={s.sector}
                  className="bg-slate-950 border border-slate-800 rounded p-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-white">{s.sector}</strong>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        s.state === "High Risk"
                          ? "border-red-500 text-red-300 bg-red-950/50"
                          : s.state === "Elevated"
                            ? "border-amber-500 text-amber-200 bg-amber-950/40"
                            : "border-slate-600 text-slate-300"
                      }`}
                    >
                      {s.state}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-purple-600/60 text-purple-200">
                      {s.pattern}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-cyan-600/60 text-cyan-200">
                      {s.timing}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>
                      Risk: <span className="text-slate-200 font-mono">{s.riskScore.toFixed(2)}</span>
                    </span>
                    <span>
                      Vol (0–1): <span className="text-slate-200">{s.volatility.toFixed(2)}</span>
                    </span>
                    <span>
                      Down share: <span className="text-slate-200">{(s.negativeRatio * 100).toFixed(0)}%</span>
                    </span>
                    <span>
                      Vol spike share: <span className="text-slate-200">{(s.volumeSpikeRatio * 100).toFixed(0)}%</span>
                    </span>
                    <span>
                      Vol accel: <span className="text-slate-200">{s.volumeAccel.toFixed(2)}x</span>
                    </span>
                    <span>
                      Volatility accel: <span className="text-slate-200">{s.volatilityAccel.toFixed(2)}</span>
                    </span>
                    <span>
                      Breadth accel: <span className="text-slate-200">{(s.negativeAccel * 100).toFixed(0)}%</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <MiniTable title="🚀 Top Gainers" stocks={data.gainers} color="text-green-400" />
        <MiniTable title="🔻 Top Losers" stocks={data.losers} color="text-red-400" />
        <MiniTable title="💰 Most Active" stocks={data.active} color="text-yellow-400" />
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <h2 className="text-lg font-semibold mb-4">All Stocks</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2">Ticker</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Variation</th>
              <th className="text-right py-2">Volume</th>
            </tr>
          </thead>
          <tbody>
            {data.stocks?.map((s) => (
              <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="py-2 font-mono font-bold">{s.mnemo}</td>
                <td className="py-2 text-right">{s.last_trade_price?.toFixed(3)}</td>
                <td
                  className={`py-2 text-right font-semibold ${
                    s.var_prev_close >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {s.var_prev_close >= 0 ? "+" : ""}{s.var_prev_close?.toFixed(2)}%
                </td>
                <td className="py-2 text-right text-slate-400">
                  {Math.round(s.quantity * s.last_trade_price).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SignalBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs px-2 py-1 rounded-full border border-slate-700 bg-slate-900 text-slate-200">
      {label}: <span className="text-blue-300">{value}</span>
    </span>
  );
}

function MiniTable({ title, stocks, color }: { title: string; stocks: Stock[]; color: string }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
      <h2 className={`font-semibold mb-3 ${color}`}>{title}</h2>
      {stocks?.map((s) => (
        <div key={s.id} className="flex justify-between text-sm py-1 border-b border-slate-800">
          <span className="font-mono font-bold">{s.mnemo}</span>
          <span className={s.var_prev_close >= 0 ? "text-green-400" : "text-red-400"}>
            {s.var_prev_close >= 0 ? "+" : ""}{s.var_prev_close?.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}