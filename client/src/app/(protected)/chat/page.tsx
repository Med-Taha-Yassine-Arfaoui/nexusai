"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // ✅ Speech-To-Text Setup (INSIDE the component)
  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      : null;
  useEffect(() => {
  if (SpeechRecognition && !recognitionRef.current) {
    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.continuous = false;
    recog.interimResults = false;

    recognitionRef.current = recog;
  }
}, [SpeechRecognition]);


  // ✅ Voice Function (must be inside component)
// ✅ Voice Function (must be inside component)
function startListening() {
  const recognition = recognitionRef.current;
  if (!recognition) {
    console.warn("SpeechRecognition not supported.");
    return;
  }

  if (isListening) return;
  setIsListening(true);

  let hasSpoken = false;
  let silenceTimer: any = null;

  recognition.start();

  // ✅ Reset silence timer every time recognition starts
  const resetSilenceTimer = () => {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      // ✅ If user didn't speak for 2 seconds → stop gracefully
      if (!hasSpoken) {
        recognition.stop();
      }
    }, 2000);
  };

  resetSilenceTimer();

  recognition.onresult = (event: any) => {
    hasSpoken = true;
    const text = event.results[0][0].transcript;
    setInput(text);
    setIsListening(false);
  };

  recognition.onspeechstart = () => {
    hasSpoken = true;
    resetSilenceTimer();
  };

  recognition.onsoundstart = () => {
    resetSilenceTimer();
  };

  recognition.onerror = (error: any) => {
    // ✅ Ignore "no-speech", "aborted" and "network" — they are normal
    if (error.error !== "no-speech") {
      console.warn("Voice error:", error.error);
    }

    setIsListening(false);
  };

  recognition.onend = () => {
    // ✅ Called when speech stops or user goes silent
    clearTimeout(silenceTimer);
    setIsListening(false);
  };
}
// ✅ DO NOT put another } here

  // ✅ Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send Message
  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/chat/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();

      const aiMsg: Message = {
        role: "assistant",
        content: data.answer ?? "No response",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error contacting NexusAI",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl max-w-[75%] ${
              msg.role === "user"
                ? "bg-blue-600 text-white ml-auto"
                : "bg-gray-800 text-gray-200"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="p-4 bg-gray-800 rounded-xl max-w-[75%] text-gray-400">
            NexusAI is thinking…
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask NexusAI anything…"
            className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />

          <button
            onClick={sendMessage}
            className="px-6 bg-blue-600 rounded-lg hover:bg-blue-700 font-bold"
          >
            Send
          </button>

          {/* ✅ Mic button */}
          <button
            onClick={startListening}
            className="px-4 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            🎤
          </button>
        </div>
      </div>
    </div>
  );
}