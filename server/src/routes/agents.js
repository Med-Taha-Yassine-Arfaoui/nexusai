import express from "express";
import { runResearcherStream } from "../agents/researcher.js";
import { runCriticStream } from "../agents/critic.js";
import { runSynthesizerStream } from "../agents/synthesizer.js";

const router = express.Router();

// Helper to collect streaming output into a string
async function collectStream(streamGenerator) {
  let fullText = "";
  for await (const token of streamGenerator) {
    fullText += token;
  }
  return fullText;
}

router.post("/run", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Query is required" });
    }

    console.log("Running AI agents via HTTP:", query);

    // FAKE WEBSOCKET — collect tokens into a buffer
    const fakeWS = {
      send: () => {} // ignore WS messages
    };

    // 1. Researcher
    const researcherStream = await runResearcherStream(query, fakeWS);
    const researcherOutput = researcherStream; // already final text

    // 2. Critic
    const criticStream = await runCriticStream(researcherOutput, fakeWS);
    const criticOutput = criticStream;

    // 3. Synthesizer
    const finalStream = await runSynthesizerStream(researcherOutput, criticOutput, fakeWS);
    const finalOutput = finalStream;

    // Return the results just like before
    return res.json({
      researcher: researcherOutput,
      critic: criticOutput,
      synthesizer: finalOutput,
      final: finalOutput,
    });

  } catch (err) {
    console.error("Agent Pipeline Error:", err);
    res.status(500).json({ error: "AI pipeline failed", details: err.message });
  }
});

export default router;