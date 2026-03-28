
/**
 * Synthesizer Agent
 *
 * Goal:
 *  - Merge the Researcher + Critic outputs
 *  - Produce a final polished explanation
 *  - Ensure clarity, accuracy, and readability
 *  - Produce structured paragraphs
 */import { llmStream } from "../lib/llm.js";

export async function runSynthesizerStream(researcherOutput, criticOutput, ws) {
  ws.send(
    JSON.stringify({
      type: "agent_start",
      agent: "synthesizer",
    })
  );

  const stream = await llmStream({
    model: "llama-3.3-70b-versatile",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `You are the Synthesizer Agent. Combine Researcher and Critic. Produce a clean, polished, unified answer.`,
      },
      {
        role: "user",
        content: `Researcher:\n${researcherOutput}\n\nCritic:\n${criticOutput}\n\nWrite the final improved answer:`,
      },
    ],
  });

  let fullText = "";

  for await (const token of stream) {
    fullText += token;

    ws.send(
      JSON.stringify({
        type: "agent_delta",
        agent: "synthesizer",
        data: token,
      })
    );
  }

  ws.send(
    JSON.stringify({
      type: "agent_end",
      agent: "synthesizer",
    })
  );

  return fullText;
}
``