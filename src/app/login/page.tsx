"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AUTHORITIES = [
  { id: 'admin_roads', pass: 'pass123', name: 'Rajesh (Roads)', phone: '9876543210' },
  { id: 'admin_water', pass: 'pass123', name: 'Priya (Water)', phone: '9123456789' },
];

export default function LoginPage() {
  const [officialId, setOfficialId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const remembered = localStorage.getItem("remembered_user");
      if (remembered) {
        setOfficialId(remembered);
        setRememberMe(true);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = AUTHORITIES.find(
      (a) => a.id === officialId && a.pass === password
    );
    if (matched) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_user", JSON.stringify(matched));
        if (rememberMe) {
          localStorage.setItem("remembered_user", officialId);
        } else {
          localStorage.removeItem("remembered_user");
        }
      }
      router.push("/admin");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  const handleGuestLogin = () => {
    if (typeof window !== "undefined") {
      const guestUser = {
        id: "guest",
        name: "Guest Auditor",
        role: "guest",
        phone: "0000000000",
      };
      sessionStorage.setItem("auth_user", JSON.stringify(guestUser));
      router.push("/admin");
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
          <div className="flex items-center justify-between text-sm mt-1">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
              />
              Remember Me
            </label>
            <button
              type="button"
              onClick={() => window.alert('Please contact the Municipal IT Department (Ext: 101) to reset your credentials')}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Forgot Password?
            </button>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white font-bold rounded-md px-4 py-2 mt-2 hover:bg-blue-700 transition-all"
          >
            Login
          </button>
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full mt-2 border border-slate-400 text-slate-600 font-semibold rounded-md px-4 py-2 hover:bg-slate-800 hover:text-white transition-all"
          >
            Demo Guest Access
          </button>
        </form>
        {error && <div className="text-red-600 mt-4 text-sm font-medium">{error}</div>}
      </div>
    </div>
  );
}
