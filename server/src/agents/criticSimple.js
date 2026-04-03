import { llm } from "../lib/llm.js";

export async function runCritic(text) {
  return await llm({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      { role: "system", content: "You are the Critic agent." },
      { role: "user", content: text }
    ]
  });
}