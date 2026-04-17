"use client";
import { useEffect, useState } from "react";

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

export default function InsightsPage() {
  const [topSectors, setTopSectors] = useState<any | null>(null);
  const [tickerInput, setTickerInput] = useState("");
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState("");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [aiInsight, setAiInsight] = useState<AiSummaryPayload | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);
  const [aiDetailsOpen, setAiDetailsOpen] = useState(false);

  useEffect(() => {
    // Top Sectors
    fetch("http://localhost:5000/api/market")
      .then((res) => res.json())
      .then((res) => {
        if (res.topSectors) setTopSectors(res.topSectors);
      })
      .catch((err) => console.error("Fetch error:", err));

    // Summary + AI
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

    // Risk
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
      .finally(() => setRiskLoading(false));
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

  return (
    <div className="p-8 text-white min-h-screen bg-slate-950">
      <h1 className="text-3xl font-bold text-blue-400 mb-8">Insights & Intelligence</h1>

      {/* Market Intelligence */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 rounded-xl border border-indigo-500/30 p-4 mb-8 shadow-lg shadow-indigo-950/20">
        <h2 className="text-lg font-semibold mb-2 text-indigo-200">Intelligence de marché</h2>

        {/* Top Sectors */}
        {topSectors && (
          <div className="mb-3 rounded border border-slate-700/40 bg-slate-950/20 p-3">
            <div className="text-xs text-slate-400 font-semibold mb-2">Top sectors today</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 font-semibold">By performance</div>
                <ul className="mt-2 text-slate-200 text-sm space-y-1">
                  {topSectors.byPerf.map((sector: any) => (
                    <li key={sector.sector} className="flex justify-between">
                      <span className="capitalize">{sector.sector}</span>
                      <span className="text-slate-400">{sector.avgPerformance}% · vol {Math.round(sector.totalVolume)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">By flow</div>
                <ul className="mt-2 text-slate-200 text-sm space-y-1">
                  {topSectors.byFlow.map((sector: any) => (
                    <li key={sector.sector} className="flex justify-between">
                      <span className="capitalize">{sector.sector}</span>
                      <span className="text-slate-400">flow {Math.round(sector.flow)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {summaryLoading && <p className="text-slate-400 text-sm">Synthesizing flow, risk, and timing...</p>}
        {summaryError && <p className="text-amber-400 text-sm">{summaryError}</p>}

        {summary && (
          <div className="space-y-3">
            {/* AI Insight */}
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
                  onClick={() => setAiDetailsOpen((open) => !open)}
                  className="text-xs text-violet-300 hover:text-violet-100 underline-offset-2 hover:underline"
                >
                  {aiDetailsOpen ? "Hide structured detail" : "Key drivers, risks, opportunities"}
                </button>
                {aiDetailsOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <p className="text-slate-500 mb-1 font-medium">Key drivers</p>
                      <ul className="list-disc pl-4 text-slate-300 space-y-1">
                        {aiInsight.keyDrivers.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1 font-medium">Risks</p>
                      <ul className="list-disc pl-4 text-amber-200/90 space-y-1">
                        {aiInsight.risks.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1 font-medium">Opportunities</p>
                      <ul className="list-disc pl-4 text-emerald-200/90 space-y-1">
                        {aiInsight.opportunities.length ? (
                          aiInsight.opportunities.map((item, idx) => <li key={idx}>{item}</li>)
                        ) : (
                          <li className="text-slate-500 list-none pl-0">None highlighted by signals.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deterministic Summary */}
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
                  Rotation strength: {summary.relativeRotationStrength}x
                </span>
              )}
              {summary.opportunityStrength === "strong" && (
                <span className="px-2 py-1 rounded border border-teal-600/50 bg-teal-950/40 text-teal-100">
                  Tech opportunity: strong
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

      {/* Ticker Analyzer */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">Moteur d'intelligence de marché</h2>
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
                {insight.price?.toFixed(3)} ({insight.change >= 0 ? "+" : ""}{insight.change?.toFixed(2)}%)
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
              <p className="text-sm text-slate-300 mt-2">{Math.round(insight.confidence * 100)}% confidence</p>
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

      {/* Risk Monitor */}
      <div className="bg-slate-900 rounded-xl border border-red-900/40 p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-red-200">Moniteur de risque</h2>

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
              {risk.signals.map((signal) => (
                <div
                  key={signal.sector}
                  className="bg-slate-950 border border-slate-800 rounded p-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-white">{signal.sector}</strong>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      signal.state === "High Risk"
                        ? "border-red-500 text-red-300 bg-red-950/50"
                        : signal.state === "Elevated"
                          ? "border-amber-500 text-amber-200 bg-amber-950/40"
                          : "border-slate-600 text-slate-300"
                    }`}>
                      {signal.state}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-purple-600/60 text-purple-200">
                      {signal.pattern}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-cyan-600/60 text-cyan-200">
                      {signal.timing}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>Risk: <span className="text-slate-200 font-mono">{signal.riskScore.toFixed(2)}</span></span>
                    <span>Vol (0–1): <span className="text-slate-200">{signal.volatility.toFixed(2)}</span></span>
                    <span>Down share: <span className="text-slate-200">{(signal.negativeRatio * 100).toFixed(0)}%</span></span>
                    <span>Vol spike share: <span className="text-slate-200">{(signal.volumeSpikeRatio * 100).toFixed(0)}%</span></span>
                    <span>Vol accel: <span className="text-slate-200">{signal.volumeAccel.toFixed(2)}x</span></span>
                    <span>Volatility accel: <span className="text-slate-200">{signal.volatilityAccel.toFixed(2)}</span></span>
                    <span>Breadth accel: <span className="text-slate-200">{(signal.negativeAccel * 100).toFixed(0)}%</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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