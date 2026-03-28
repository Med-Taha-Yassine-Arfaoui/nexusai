/**
 * Critic Agent
 *
 * Goal:
 *  - Analyze the Researcher's output
 *  - Identify mistakes or missing information
 *  - Suggest corrections and improvements
 *  - Improve factual accuracy and completeness
 */import { llmStream } from "../lib/llm.js";

export async function runCriticStream(researcherOutput, ws) {
  ws.send(
    JSON.stringify({
      type: "agent_start",
      agent: "critic",
    })
  );

  const stream = await llmStream({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: `You are the Critic Agent. Analyze the Researcher's notes. Identify inaccuracies, gaps, missing info, contradictions, hallucinations.`,
      },
      {
        role: "user",
        content: `Researcher output:\n\n${researcherOutput}\n\nCritique it.`,
      },
    ],
  });

  let fullText = "";

  for await (const token of stream) {
    fullText += token;

    ws.send(
      JSON.stringify({
        type: "agent_delta",
        agent: "critic",
        data: token,
      })
    );
  }

  ws.send(
    JSON.stringify({
      type: "agent_end",
      agent: "critic",
    })
  );

  return fullText; // needed for synthesizer
}