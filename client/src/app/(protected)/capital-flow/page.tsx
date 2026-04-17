"use client";
import { useEffect, useState } from "react";

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

export default function CapitalFlowPage() {
  const [flow, setFlow] = useState<CapitalFlowResponse | null>(null);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowError, setFlowError] = useState("");

  useEffect(() => {
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
  }, []);

  return (
    <div className="p-8 text-white min-h-screen bg-slate-950">
      <h1 className="text-3xl font-bold text-cyan-300 mb-8">Capital Flow</h1>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">Capital Flow Overview</h2>

        {flowLoading && <p className="text-slate-300">Loading capital flow...</p>}
        {flowError && <p className="text-red-400">{flowError}</p>}

        {flow && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Top sectors by inflow</p>
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
    </div>
  );
}
