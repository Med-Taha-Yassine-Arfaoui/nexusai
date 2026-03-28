import express from "express";
import { runResearcher } from "../agents/researcher.js";
import { runCritic } from "../agents/critic.js";
import { runSynthesizer } from "../agents/synthesizer.js";

const router = express.Router();

// Orchestrator: Runs all 3 agents
router.post("/run", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Query is required" });
    }

    console.log("Running AI agents for query:", query);

    // STEP 1 — Researcher runs FIRST
    const researcherOutput = await runResearcher(query);

    // STEP 2 — Critic checks Researcher
    const criticOutput = await runCritic(researcherOutput);

    // STEP 3 — Synthesizer combines both
    const finalOutput = await runSynthesizer(
      researcherOutput,
      criticOutput
    );

    // Return everything for UI
    return res.json({
      researcher: researcherOutput,
      critic: criticOutput,
      synthesizer: finalOutput,
      final: finalOutput,
    });

  } catch (err) {
    console.error("Agent Pipeline Error:", err.message);
    res.status(500).json({ error: "AI pipeline failed", details: err.message });
  }
});

export default router;