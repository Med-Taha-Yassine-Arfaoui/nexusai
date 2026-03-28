"use client";

import { useEffect, useRef, useState } from "react";

interface CardProps {
  title: string;
  active?: boolean;
  children: React.ReactNode;
}

export default function AgentsPage() {
  const [query, setQuery] = useState("");

  const [researcher, setResearcher] = useState("");
  const [critic, setCritic] = useState("");
  const [synthesizer, setSynthesizer] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");

  const [connected, setConnected] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.type === "agent_start") {
        setCurrentAgent(data.agent);
        return;
      }

      if (data.type === "agent_delta") {
        if (data.agent === "researcher") setResearcher((t) => t + data.data);
        if (data.agent === "critic") setCritic((t) => t + data.data);
        if (data.agent === "synthesizer") setSynthesizer((t) => t + data.data);
        return;
      }

      if (data.type === "agent_end") {
        setCurrentAgent(null);
        return;
      }

      if (data.type === "final_answer") {
        setFinalAnswer(data.data);
        return;
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [researcher, critic, synthesizer, finalAnswer]);

  function runAgents() {
    if (!connected) return alert("WebSocket not connected");

    setResearcher("");
    setCritic("");
    setSynthesizer("");
    setFinalAnswer("");

    wsRef.current?.send(
      JSON.stringify({
        type: "run_agents",
        prompt: query,
      })
    );
  }

  return (
    <div className="min-h-screen p-10 bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER + STATUS */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-4xl font-bold">Multi‑Agent Streaming System 🤖</h1>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                connected ? "bg-green-400 animate-pulse" : "bg-red-500"
              }`}
            ></span>
            <span className="text-sm text-gray-300">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* INPUT BAR */}
        <div className="flex gap-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask something..."
            className="flex-1 p-4 bg-gray-800 border border-gray-600 rounded-lg"
          />
          <button
            onClick={runAgents}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Run Agents
          </button>
        </div>

        {/* AGENT OUTPUTS */}
        <div className="mt-10 space-y-6">
          
          <Card title="📘 Researcher" active={currentAgent === "researcher"}>
            <pre className="whitespace-pre-wrap text-gray-200 typing">
              {researcher || "Waiting..."}
            </pre>
          </Card>

          <Card title="📝 Critic" active={currentAgent === "critic"}>
            <pre className="whitespace-pre-wrap text-gray-200 typing">
              {critic || "Waiting..."}
            </pre>
          </Card>

          <Card title="✨ Synthesizer" active={currentAgent === "synthesizer"}>
            <pre className="whitespace-pre-wrap text-gray-200 typing">
              {synthesizer || "Waiting..."}
            </pre>
          </Card>

          <Card title="🎯 Final Answer">
            <pre className="whitespace-pre-wrap text-gray-200 typing">
              {finalAnswer || "Waiting for final answer..."}
            </pre>
          </Card>

          <div ref={bottomRef}></div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, active = false, children }: CardProps) {
  return (
    <div
      className={`
        relative p-6 rounded-xl bg-gray-800 border
        transition-all duration-300 ease-out
        ${active 
          ? "border-blue-400 shadow-lg shadow-blue-500/40 scale-[1.02]" 
          : "border-gray-600 opacity-90"
        }
      `}
    >
      <div className="flex items-center gap-3 mb-2">
        <span
          className={`
            w-3 h-3 rounded-full 
            ${active ? "bg-blue-400 animate-pulse" : "bg-gray-500"}
          `}
        ></span>
        <span className="text-xl font-bold">{title}</span>
      </div>

      <div className="leading-relaxed">{children}</div>
    </div>
  );
}