'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState<{ message: string; status: string } | null>(null);
  const [error, setError] = useState(false);
  
useEffect(() => {
  // This automatically detects if you are on localhost or your Network IP
  const backendUrl = `http://${window.location.hostname}:5000/api/status`;

  fetch(backendUrl)
    .then((res) => res.json())
    .then((json) => setData(json))
    .catch(() => setError(true));
}, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-4">
      <div className="z-10 w-full max-w-md items-center justify-between font-mono text-sm flex flex-col gap-6">
        
        <h1 className="text-4xl font-extrabold tracking-tight text-blue-500">
          NexusAI
        </h1>

        <div className="w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
          <h2 className="text-slate-400 text-xs uppercase tracking-widest mb-4">System Status</h2>
          
          {error ? (
            <p className="text-red-400">⚠️ Backend unreachable. Is npm run dev running in the root?</p>
          ) : data ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xl text-slate-100">{data.message}</p>
              </div>
              <p className="text-xs text-slate-500">Status: {data.status}</p>
            </div>
          ) : (
            <p className="text-slate-500 animate-pulse">Establishing secure link...</p>
          )}
        </div>

        <p className="text-slate-600 text-[10px]">Multi-Agent Intelligence Platform v1.0</p>
      </div>
    </main>
  );
}