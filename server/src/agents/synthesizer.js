import { llm } from "../lib/llm.js";

/**
 * Synthesizer Agent
 *
 * Goal:
 *  - Merge the Researcher + Critic outputs
 *  - Produce a final polished explanation
 *  - Ensure clarity, accuracy, and readability
 *  - Produce structured paragraphs
 */
export async function runSynthesizer(researcherOutput, criticOutput) {
  return llm({
    model: "llama-3.1-8b-instant", // Excellent for writing and synthesis
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `You are the Synthesizer Agent.
Your job is to combine the Researcher Agent's findings with the Critic Agent's corrections.
Write a FINAL clean, polished, accurate explanation.

Rules:
- FIX every issue the Critic pointed out.
- KEEP all useful facts from the Researcher.
- Write in clear, structured paragraphs.
- No bullet points unless needed.
- Be concise, accurate, and well-organized.
- DO NOT mention the Researcher or Critic: write as one unified final answer.`
      },
      {
        role: "user",
        content: `Researcher output:
${researcherOutput}

Critic output:
${criticOutput}

Using both of these, write the final improved answer:`
      }
    ]
  });
}