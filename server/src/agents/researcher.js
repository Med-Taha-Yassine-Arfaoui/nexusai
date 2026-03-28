import { llm } from "../lib/llm.js";

/**
 * Researcher Agent
 *
 * Goal:
 *  - Expand the user's query
 *  - Generate raw information
 *  - List facts, bullet points, context
 *  - Provide a broad coverage of the topic
 *  - DO NOT generate final conclusions
 */
export async function runResearcher(query) {
  return llm({
    model: "llama-3.1-8b-instant", // Groq's best free reasoning model
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are the Researcher Agent.
Your job is to gather high-quality, structured information on a topic.
Return ONLY:
- bullet points
- facts
- definitions
- lists
- context

Do NOT write a final explanation or summary.`
      },
      {
        role: "user",
        content: `Research the following topic in detail:

"${query}"

Return your findings as structured bullet points.`
      }
    ]
  });
}