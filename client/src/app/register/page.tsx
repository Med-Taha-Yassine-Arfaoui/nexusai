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
      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      // ❗ AFTER registration, redirect to LOGIN (not agents)
      router.replace("/login");

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-lg">
        <h1 className="text-center text-3xl text-blue-500 mb-6">Join NexusAI</h1>

        {error && (
          <p className="text-red-400 bg-red-500/20 p-3 rounded mb-4">
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

        <p className="mt-4 text-sm text-gray-400 text-center">
          Already have an account?
          <span
            className="ml-1 text-blue-500 cursor-pointer hover:underline"
            onClick={() => router.push("/login")}
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}