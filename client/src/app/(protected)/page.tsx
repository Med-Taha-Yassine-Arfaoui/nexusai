"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      localStorage.setItem("token", data.token);
      router.push("/"); 
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
        <h1 className="text-3xl font-bold text-blue-500 mb-6 text-center">
          Join NexusAI
        </h1>

        {error && (
          <p className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full p-3 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="w-full p-3 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded font-bold transition"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}