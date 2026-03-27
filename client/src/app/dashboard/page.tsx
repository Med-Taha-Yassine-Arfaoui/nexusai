"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    setAuthenticated(true);
  }, [router]);

  if (!authenticated) {
    return <p>Checking authentication...</p>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Welcome to your Dashboard 🚀</h1>
      <p>You are authenticated!</p>

      <button
        style={{ padding: 10, marginTop: 20 }}
        onClick={() => {
          localStorage.removeItem("token");
          router.push("/login");
        }}
      >
        Logout
      </button>
    </div>
  );
}