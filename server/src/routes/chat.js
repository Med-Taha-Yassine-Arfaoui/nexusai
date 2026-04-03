import express from "express";
import { runResearchPipeline } from "../agents/researchPipeline.js";

const router = express.Router();

router.post("/research", async (req, res) => {
  try {
    const { prompt } = req.body;

    const answer = await runResearchPipeline(prompt);

    res.json({ answer });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;