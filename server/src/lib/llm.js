import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Normal non‑streaming LLM call
export async function llm({
  model = "llama-3.1-8b-instant",
  messages,
  temperature = 0.2,
  maxTokens = 2048,
  retries = 3,
}) {
  while (retries > 0) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      const text = response.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("Empty LLM response");

      return text;
    } catch (err) {
      retries--;
      if (retries <= 0) {
        throw new Error("LLM failed after retries: " + err.message);
      }
    }
  }
}

// ⭐ STREAMING FUNCTION (token-by-token)
export async function llmStream({
  model = "llama-3.1-8b-instant",
  messages,
  temperature = 0.2,
  maxTokens = 2048,
}) {
  // 👇 IMPORTANT: stream: true
  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  // Return async generator (async iterator)
  async function* streamGenerator() {
    for await (const chunk of response) {
      const token = chunk.choices?.[0]?.delta?.content;
      if (token) yield token;
    }
  }

  return streamGenerator();
}