"use client";

import { useState } from "react";

export default function AgentsPage() {
  const [query, setQuery] = useState("");
  const [researcher, setResearcher] = useState("");
  const [critic, setCritic] = useState("");
  const [synthesizer, setSynthesizer] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function runAgents() {
    if (!query.trim()) return;

    setLoading(true);
    setResearcher("");
    setCritic("");
    setSynthesizer("");
    setFinalAnswer("");

    try {
      const res = await fetch("http://localhost:5000/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      setResearcher(data.researcher || "");
      setCritic(data.critic || "");
      setSynthesizer(data.synthesizer || "");
      setFinalAnswer(data.final || "");
    } catch (err) {
      setFinalAnswer("Error running agents.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen p-10 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex justify-center">
      <div className="w-full max-w-5xl">

        {/* Title */}
        <h1 className="text-5xl font-extrabold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-xl">
          Multi‑Agent AI System 🤖
        </h1>
        <p className="text-center text-gray-300 mt-3">
          Ask a question and watch 3 AI agents collaborate in real‑time.
        </p>

        {/* Glass Input Box */}
        <div className="mt-10 flex gap-4">
          <input
            placeholder="Ask the AI something..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-4 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-gray-300 shadow-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={runAgents}
            disabled={loading}
            className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 shadow-xl font-semibold"
          >
            {loading ? "Thinking..." : "Run Agents"}
          </button>
        </div>

        {/* Agent Sections */}
        <div className="grid grid-cols-1 gap-8 mt-12">

          {/* Researcher */}
          <GlassCard title="📘 Researcher Output" color="blue">
            {researcher || (loading ? "Researcher is gathering information..." : "")}
          </GlassCard>

          {/* Critic */}
          <GlassCard title="📝 Critic Output" color="red">
            {critic || (loading ? "Critic is analyzing..." : "")}
          </GlassCard>

          {/* Synthesizer */}
          <GlassCard title="✨ Synthesizer Output" color="green">
            {synthesizer || (loading ? "Synthesizer is writing..." : "")}
          </GlassCard>

          {/* Final Answer */}
          <GlassCard title="🎯 Final Answer" color="purple" large>
            {finalAnswer || (loading ? "Finalizing answer..." : "")}
          </GlassCard>

        </div>
      </div>
    </div>
  );
}

/* ---------- Reusable GlassCard Component ---------- */

function GlassCard({ title, color, children, large }: any) {
  const colorMap: any = {
    blue: "from-blue-500/30 to-blue-300/10 border-blue-400/40",
    red: "from-red-500/30 to-red-300/10 border-red-400/40",
    green: "from-green-500/30 to-green-300/10 border-green-400/40",
    purple: "from-purple-500/30 to-purple-300/10 border-purple-400/40",
  };

  return (
    <div
      className={`
        p-6 rounded-2xl shadow-2xl border backdrop-blur-xl
        bg-gradient-to-br ${colorMap[color]}
      `}
    >
      <h2 className="text-2xl font-bold mb-3 drop-shadow-sm">{title}</h2>

      <pre
        className={`
          whitespace-pre-wrap p-4 rounded-xl bg-black/30 shadow-inner text-gray-100 
          ${large ? "text-lg leading-relaxed" : "text-md"}
        `}
      >
        {children}
      </pre>
    </div>
  );
}