"use client";

import { useEffect, useState } from "react";

export default function AccountPage() {
  const [email, setEmail] = useState<string>("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setNewEmail(savedEmail);
    }
  }, []);

  // UPDATE EMAIL
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) return setMessage("Not logged in.");

      const res = await fetch("http://localhost:5000/auth/change-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email update failed");

      localStorage.setItem("userEmail", newEmail);
      setEmail(newEmail);
      setMessage("Email updated successfully!");
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  // UPDATE PASSWORD
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) return setMessage("Not logged in.");

      const res = await fetch("http://localhost:5000/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password update failed");

      setNewPassword("");
      setMessage("Password updated successfully!");
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-900 text-white p-10 rounded-xl border border-slate-700 shadow-xl">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

      {/* PROFILE HEADER */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 bg-blue-600 flex items-center justify-center rounded-full text-white text-2xl font-bold">
          {email ? email.charAt(0).toUpperCase() : "U"}
        </div>
        <div>
          <p className="text-lg text-gray-300">{email}</p>
          <p className="text-sm text-gray-500">Your NexusAI account</p>
        </div>
      </div>

      {message && (
        <p className="mb-6 p-3 rounded bg-blue-600/20 text-blue-300 border border-blue-500">
          {message}
        </p>
      )}

      {/* CHANGE EMAIL */}
      <h2 className="text-xl font-bold mb-3">Change Email</h2>
      <form onSubmit={handleEmailUpdate} className="space-y-4 mb-8">
        <input
          type="email"
          value={newEmail}
          className="w-full p-3 rounded bg-slate-800 border border-slate-700 focus:border-blue-500"
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <button
          type="submit"
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded font-bold"
        >
          Update Email
        </button>
      </form>

      {/* CHANGE PASSWORD */}
      <h2 className="text-xl font-bold mb-3">Change Password</h2>
      <form onSubmit={handlePasswordUpdate} className="space-y-4">
        <input
          type="password"
          placeholder="New Password"
          required
          className="w-full p-3 rounded bg-slate-800 border border-slate-700 focus:border-blue-500"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded font-bold"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}