import { runResearcherStream } from "../agents/researcher.js";
import { runCriticStream } from "../agents/critic.js";
import { runSynthesizerStream } from "../agents/synthesizer.js";

// Main entry: called when frontend sends { type: "run_agents" }
export async function orchestrateAgents(ws, prompt) {
  try {
    console.log("⚡ Starting agent pipeline for:", prompt);

    // --- 1) Run Researcher with streaming ---
    const researcherOutput = await runResearcherStream(prompt, ws);

    // --- 2) Run Critic with streaming ---
    const criticOutput = await runCriticStream(researcherOutput, ws);

    // --- 3) Run Synthesizer with streaming ---
    const finalOutput = await runSynthesizerStream(
      researcherOutput,
      criticOutput,
      ws
    );

    // --- FINAL ANSWER EVENT ---
    ws.send(
      JSON.stringify({
        type: "final_answer",
        data: finalOutput,
      })
    );

    console.log("🎉 Pipeline complete!");

  } catch (err) {
    console.error("❌ Agent Orchestrator Error:", err);

    ws.send(
      JSON.stringify({
        type: "error",
        message: err.message || "Unknown error in agent pipeline",
      })
    );
  }
}