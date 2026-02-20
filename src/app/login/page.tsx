"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AUTHORITIES = [
  { id: 'admin_roads', pass: 'pass123', name: 'Rajesh (Roads)', phone: '9876543210' },
  { id: 'admin_water', pass: 'pass123', name: 'Priya (Water)', phone: '9123456789' },
];

export default function LoginPage() {
  const [officialId, setOfficialId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = AUTHORITIES.find(
      (a) => a.id === officialId && a.pass === password
    );
    if (matched) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_user", JSON.stringify(matched));
      }
      router.push("/admin");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">Authority Login</h2>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            placeholder="Official ID"
            value={officialId}
            onChange={e => setOfficialId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:ring-blue-600 focus:border-blue-600"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:ring-blue-600 focus:border-blue-600"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white font-bold rounded-md px-4 py-2 mt-2 hover:bg-blue-700 transition-all"
          >
            Login
          </button>
        </form>
        {error && <div className="text-red-600 mt-4 text-sm font-medium">{error}</div>}
      </div>
    </div>
  );
}
