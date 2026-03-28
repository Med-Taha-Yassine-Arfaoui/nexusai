import { llmStream } from "../lib/llm.js";

export async function runResearcherStream(query, ws) {
  ws.send(JSON.stringify({
    type: "agent_start",
    agent: "researcher",
  }));

  const stream = await llmStream({
    model: "llama-3.1-8b-instant",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are the Researcher Agent. Generate structured bullet points, facts, definitions, context. No final conclusions."
      },
      {
        role: "user",
        content: `Research this topic:\n\"${query}\"\nReturn bullet points only.`
      }
    ]
  });

  let fullText = "";

  for await (const token of stream) {
    fullText += token;

    ws.send(JSON.stringify({
      type: "agent_delta",
      agent: "researcher",
      data: token,
    }));
  }

  ws.send(JSON.stringify({
    type: "agent_end",
    agent: "researcher",
  }));

  return fullText;
}
