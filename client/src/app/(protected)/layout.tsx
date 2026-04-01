"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");

    if (!token) {
      router.replace("/login");
      return;
    }

    setUserEmail(email || "");
    setReady(true);
  }, []);

  if (!ready) return null;

  const menu = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "Research", path: "/agents", icon: "🧠" },
    { name: "Chat", path: "/chat", icon: "💬" },
    { name: "Memory", path: "/memory", icon: "📚" },
    { name: "Settings", path: "/settings", icon: "⚙️" },
    { name: "Account", path: "/account", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* SIDEBAR */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-gray-900 border-r border-gray-800 p-6 h-screen fixed transition-all duration-300`}
      >
        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>

        {/* Logo */}
        <h1
          className={`text-xl font-bold mb-8 text-white transition-all ${
            collapsed ? "opacity-0 w-0" : "opacity-100"
          }`}
        >
          NEXUS AI ⚡
        </h1>

        {/* Navigation */}
        <nav className="space-y-2">
          {menu.map((item) => {
            const active = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                  ${active ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-800 hover:text-white"}
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                <span className="text-xl">{item.icon}</span>

                {!collapsed && (
                  <span className="text-base">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("userEmail");
            window.location.href = "/login";
          }}
          className={`mt-6 w-full bg-red-600 hover:bg-red-700 p-3 rounded font-bold transition ${
            collapsed ? "text-xs px-2" : ""
          }`}
        >
          {collapsed ? "🚪" : "Logout"}
        </button>
      </aside>

      {/* TOP NAVBAR */}
      <div className="flex-1 ml-64">
        <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-end px-8">
          <span className="text-gray-300 mr-4">
            Hello, {userEmail || "User"} 👋
          </span>

          <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-full text-white font-bold">
            {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="p-10">{children}</main>
      </div>
    </div>
  );
}