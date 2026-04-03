import { llm } from "../lib/llm.js";

export async function runResearcher(prompt) {
  return await llm({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    messages: [
      { role: "system", content: "You are the Researcher agent." },
      { role: "user", content: prompt }
    ]
  });
}