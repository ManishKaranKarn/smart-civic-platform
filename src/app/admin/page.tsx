"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  // Protect route
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = sessionStorage.getItem("auth_user");
      if (!userStr) {
        router.push("/login");
        return;
      }
      setAuthUser(JSON.parse(userStr));
    }
  }, [router]);

  const [authUser, setAuthUser] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [newIssueNotification, setNewIssueNotification] = useState(false);

  // Load issues from localStorage safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("civic_issues");
      setIssues(stored ? JSON.parse(stored) : []);
    }
  }, []);

  // Real-time cross-tab notification
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === "civic_issues") {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("civic_issues");
          setIssues(stored ? JSON.parse(stored) : []);
          setNewIssueNotification(true);
          setTimeout(() => setNewIssueNotification(false), 5000);
        }
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Metrics
  const total = issues.length;
  const pending = issues.filter((i) => i.status === "Pending").length;
  const resolved = issues.filter((i) => i.status === "Resolved").length;

  // Assign Official
  const handleAssign = (id: number) => {
    if (!authUser) return;
    const updated = issues.map((issue) =>
      issue.id === id
        ? { ...issue, assignedName: authUser.name, assignedPhone: authUser.phone }
        : issue
    );
    setIssues(updated);
    localStorage.setItem("civic_issues", JSON.stringify(updated));
  };

  // Mark Resolved
  const handleResolve = (id: number) => {
    const updated = issues.map((issue) =>
      issue.id === id ? { ...issue, status: "Resolved" } : issue
    );
    setIssues(updated);
    localStorage.setItem("civic_issues", JSON.stringify(updated));
  };

  // Add Note
  const handleAddNote = (id: number) => {
    const note = window.prompt("Enter update note for citizen:");
    if (note === null || note.trim() === "") return;
    const updated = issues.map((issue) =>
      issue.id === id ? { ...issue, authorityNote: note } : issue
    );
    setIssues(updated);
    localStorage.setItem("civic_issues", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4">
      {/* Toast Notification */}
      {newIssueNotification && (
        <div className="fixed top-6 right-6 z-50 bg-blue-600 text-white shadow-lg rounded-md p-4 flex items-center gap-2 animate-fade-in">
          <span className="text-xl">🔔</span>
          <span>Alert: A new issue has been reported and assigned to your department!</span>
        </div>
      )}

      {/* Back Link */}
      <div className="w-full max-w-6xl mb-6 flex justify-between items-center">
        <Link href="/" className="text-blue-600 hover:underline text-sm font-medium flex items-center">
          <span className="mr-2">←</span> Back to Home
        </Link>
        {authUser && (
          <span className="text-slate-700 font-semibold text-sm">Welcome, {authUser.name}</span>
        )}
      </div>

      {/* Metrics */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 p-4 flex flex-col items-center">
          <span className="text-slate-700 text-lg font-medium mb-1">Total Issues</span>
          <span className="text-5xl font-bold text-slate-900">{total}</span>
        </div>
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 p-4 flex flex-col items-center">
          <span className="text-slate-700 text-lg font-medium mb-1">Pending Issues</span>
          <span className="text-5xl font-bold text-yellow-600">{pending}</span>
        </div>
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 p-4 flex flex-col items-center">
          <span className="text-slate-700 text-lg font-medium mb-1">Resolved Issues</span>
          <span className="text-5xl font-bold text-green-700">{resolved}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full max-w-6xl bg-white rounded-sm shadow-sm border border-slate-300 overflow-x-auto">
        <table className="min-w-full text-base">
          <thead className="bg-slate-200 text-slate-700 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">ID</th>
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">Type</th>
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">Description</th>
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">Location</th>
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">Status</th>
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">Assigned To</th>
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-400 py-8">No issues reported.</td>
              </tr>
            ) : (
              issues.map((issue, idx) => (
                <tr key={issue.id} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
                  <td className="px-3 py-2 border-b border-slate-200 font-mono text-slate-900 text-base">{issue.id}</td>
                  <td className="px-3 py-2 border-b border-slate-200 text-slate-800 text-base">{issue.issueType}</td>
                  <td className="px-3 py-2 border-b border-slate-200 text-slate-800 max-w-xs truncate text-base">{issue.description}</td>
                  <td className="px-3 py-2 border-b border-slate-200 text-slate-700 text-base">
                    {issue.coordinates ? (
                      <span>Lat {issue.coordinates.lat.toFixed(3)}, Lng {issue.coordinates.lng.toFixed(3)}</span>
                    ) : (
                      <span className="text-slate-300">N/A</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b border-slate-200">
                    <span className={`px-2 py-1 rounded-sm text-xs font-bold ${
                      issue.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-400"
                        : issue.status === "Resolved"
                        ? "bg-green-100 text-green-700 border border-green-400"
                        : "bg-red-100 text-red-700 border border-red-400"
                    }`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-slate-200 text-base">
                    <span className="text-slate-900 font-medium">
                      {issue.assignedName} <span className="text-slate-400">|</span> {issue.assignedPhone}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-slate-200 flex flex-col gap-2 min-w-[120px]">
                    <button
                      className="bg-slate-900 text-white rounded-sm px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition-all"
                      onClick={() => handleAddNote(issue.id)}
                    >
                      Add Note
                    </button>
                    {issue.status === "Pending" && (
                      <button
                        className="bg-green-700 text-white rounded-sm px-4 py-2 text-sm font-semibold hover:bg-green-800 transition-all"
                        onClick={() => handleResolve(issue.id)}
                      >
                        Mark Resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
