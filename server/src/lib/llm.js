import Groq from "groq-sdk";

// Create Groq client with API key from .env
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Timeout wrapper (never let LLM calls hang forever)
function withTimeout(promise, ms = 20000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("LLM request timed out")), ms)
    ),
  ]);
}

// Main LLM function used by all agents
export async function llm({
  model = "llama3-8b-8192",
  messages,
  temperature = 0.2,
  maxTokens = 2048,
  retries = 3,
}) {
  while (retries > 0) {
    try {
      const start = Date.now();

      const response = await withTimeout(
        client.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        })
      );

      const duration = Date.now() - start;
      console.log(
        `[LLM] Model: ${model} | Time: ${duration}ms | Tokens: ${
          response.usage?.total_tokens || "N/A"
        }`
      );

      const text = response.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("Empty LLM response");

      return text;

    } catch (err) {
      console.error("[LLM ERROR]", err.message);
      retries -= 1;

      if (retries <= 0) {
        throw new Error("LLM failed after retries: " + err.message);
      }

      console.log("Retrying LLM request...");
    }
  }
}