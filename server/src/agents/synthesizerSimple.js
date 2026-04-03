import { llm } from "../lib/llm.js";

export async function runSynthesizer(research, critique) {
  return await llm({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      { role: "system", content: "You combine and summarize." },
      { role: "user", content: `Research:\n${research}\n\nCritique:\n${critique}` }
    ]
  });
}