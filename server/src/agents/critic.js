import { llm } from "../lib/llm.js";

/**
 * Critic Agent
 *
 * Goal:
 *  - Analyze the Researcher's output
 *  - Identify mistakes or missing information
 *  - Suggest corrections and improvements
 *  - Improve factual accuracy and completeness
 */
export async function runCritic(researcherOutput) {
  return llm({
    model: "llama-3.1-8b-instant", // Groq's best ANALYSIS model (free)
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You are the Critic Agent.
Your job is to analyze the Researcher Agent's notes.
Identify inaccuracies, missing information, contradictions, weak reasoning, and hallucinations.
Be strict, detailed, and factual.

Return your analysis in this structure:
- Corrections needed:
- Missing information:
- Contradictions found:
- Additional details to include:`
      },
      {
        role: "user",
        content: `Here is the Researcher Agent's output:

${researcherOutput}

Analyze it according to the instructions above.`
      }
    ]
  });
}