"use client";
import { useEffect, useState } from "react";

type Stock = {
  id: number;
  mnemo: string;
  last_trade_price: number;
  quantity: number;
  var_prev_close: number;
};

export default function FinancePage() {
  const [data, setData] = useState<{
  stocks: Stock[];
  gainers: Stock[];
  losers: Stock[];
  active: Stock[];
}>({
  stocks: [],
  gainers: [],
  losers: [],
  active: [],
});
useEffect(() => {
  fetch("http://localhost:5000/api/market")
    .then(res => res.json())
    .then(res => {
      setData({
        stocks: res.stocks || [],
        gainers: res.gainers || [],
        losers: res.losers || [],
        active: res.active || [],
      });
    })
    .catch(err => {
      console.error("Fetch error:", err);
      setData({
        stocks: [],
        gainers: [],
        losers: [],
        active: [],
      });
    });
}, []);
 if (!data.stocks.length) {
  return <div className="p-8 text-white">Loading market data...</div>;
}

  return (
    <div className="p-8 text-white min-h-screen bg-slate-950">
      <h1 className="text-3xl font-bold text-blue-400 mb-8">BVMT Market Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-6 mb-8">
        <MiniTable title="🚀 Top Gainers" stocks={data.gainers} color="text-green-400" />
        <MiniTable title="🔻 Top Losers"  stocks={data.losers}  color="text-red-400"   />
        <MiniTable title="💰 Most Active" stocks={data.active}  color="text-yellow-400"/>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <h2 className="text-lg font-semibold mb-4">All Stocks</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2">Ticker</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Variation</th>
              <th className="text-right py-2">Volume</th>
            </tr>
          </thead>
          <tbody>
            {data.stocks?.map(s => (
                  <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="py-2 font-mono font-bold">{s.mnemo}</td>
                <td className="py-2 text-right">{s.last_trade_price?.toFixed(3)}</td>
                <td className={`py-2 text-right font-semibold ${s.var_prev_close >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {s.var_prev_close >= 0 ? "+" : ""}{s.var_prev_close?.toFixed(2)}%
                </td>
                <td className="py-2 text-right text-slate-400">
                  {Math.round(s.quantity * s.last_trade_price).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniTable({ title, stocks, color }: { title: string; stocks: Stock[]; color: string }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
      <h2 className={`font-semibold mb-3 ${color}`}>{title}</h2>
      {stocks?.map(s => (
        <div key={s.id} className="flex justify-between text-sm py-1 border-b border-slate-800">
          <span className="font-mono font-bold">{s.mnemo}</span>
          <span className={s.var_prev_close >= 0 ? "text-green-400" : "text-red-400"}>
            {s.var_prev_close >= 0 ? "+" : ""}{s.var_prev_close?.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}