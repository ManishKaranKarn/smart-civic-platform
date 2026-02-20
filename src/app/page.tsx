import Link from 'next/link';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 h-16 px-8 flex items-center shadow-sm z-10">
        <span className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          🏛️ <span>SmartCivic</span>
        </span>
      </nav>

      {/* Hero Section */}
      <section className="w-full bg-slate-900 pt-16 pb-24 flex flex-col items-center justify-center text-center relative">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">SmartCivic</h1>
          <p className="text-base md:text-lg text-slate-300 max-w-xl mx-auto">
            Report, track, and resolve local infrastructure issues instantly.
          </p>
        </div>
      </section>

      {/* CTA Cards Grid - Overlapping the Hero Banner */}
      <section className="w-full flex justify-center -mt-16 z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-3xl w-full px-4">
          {/* Citizen Portal Card */}
          <Link href="/report" className="group bg-white rounded-md border border-slate-300 p-10 flex flex-col items-center shadow-sm transition-all hover:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900">
            <AlertTriangle className="w-12 h-12 text-slate-900 mb-4 group-hover:text-slate-800 transition-colors" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Citizen Portal</h2>
            <p className="text-slate-700 text-center mb-1">Report and track local issues</p>
          </Link>

          {/* Authority Dashboard Card */}
          <Link href="/login" className="group bg-white rounded-md border border-slate-300 p-10 flex flex-col items-center shadow-sm transition-all hover:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900">
            <ShieldCheck className="w-12 h-12 text-slate-900 mb-4 group-hover:text-slate-800 transition-colors" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Authority Dashboard</h2>
            <p className="text-slate-700 text-center mb-1">Manage and resolve city infrastructure tasks</p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 text-center text-sm">
        &copy; {new Date().getFullYear()} Municipal Corporation. All rights reserved. Emergency Contact: 112
      </footer>
    </div>
  );
}
