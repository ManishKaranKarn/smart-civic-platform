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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [performance, setPerformance] = useState<any>({ score: 0, stars: "0.0", label: "N/A", color: "text-slate-400", ringColor: "stroke-slate-200" });
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'feedback'>('dashboard');

  // Helper: Calculate priority and sort
  const getPrioritizedIssues = (allIssues: any[], userName: string) => {
    const counts: Record<string, number> = {};
    allIssues.forEach((i: any) => {
      if (i.coordinates && i.issueType) {
        const key = `${i.coordinates.lat}-${i.coordinates.lng}-${i.issueType}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return allIssues
      .filter((i: any) => i.assignedName === userName)
      .map((i: any) => {
        const key = i.coordinates && i.issueType ? `${i.coordinates.lat}-${i.coordinates.lng}-${i.issueType}` : "";
        const count = counts[key] || 0;
        return { ...i, priority: count >= 3 ? "High" : "Normal" };
      })
      .sort((a: any, b: any) => {
        if (a.priority === b.priority) return 0;
        return a.priority === "High" ? -1 : 1;
      });
  };

  // Helper: Calculate Civic Score & Payroll
  const calculatePerformance = (userIssues: any[]) => {
    if (!userIssues.length) return { score: 0, stars: "0.0", label: "No Data", color: "text-slate-400", ringColor: "stroke-slate-200" };

    const total = userIssues.length;
    const resolved = userIssues.filter((i: any) => i.status === "Resolved");
    const resolvedCount = resolved.length;

    // 1. Efficiency (40 pts): (Resolved / Total) * 40
    const efficiency = total > 0 ? (resolvedCount / total) * 40 : 0;

    // 2. Public Trust (40 pts): Net Likes vs Dislikes ratio
    let upvotes = 0;
    let downvotes = 0;
    userIssues.forEach((i: any) => {
      upvotes += (i.upvotes || 0);
      downvotes += (i.downvotes || 0);
    });
    const totalVotes = upvotes + downvotes;
    // Default 20 pts (neutral) if no votes, else ratio * 40
    const trust = totalVotes > 0 ? (upvotes / totalVotes) * 40 : 20;

    // 3. Responsiveness (20 pts): Bonus for quick close (<24h)
    let speedBonus = 0;
    resolved.forEach((i: any) => {
      if (i.resolvedAt && (i.resolvedAt - i.id < 24 * 60 * 60 * 1000)) {
        speedBonus += 5; // 5 pts per quick fix
      }
    });
    const responsiveness = Math.min(20, speedBonus);

    const totalScore = Math.min(100, Math.max(0, Math.round(efficiency + trust + responsiveness)));
    const stars = (totalScore / 20).toFixed(1);

    let label = "Good";
    let color = "text-blue-600";
    let ringColor = "stroke-blue-500";

    if (totalScore >= 90) {
      label = "Excellent";
      color = "text-emerald-600";
      ringColor = "stroke-emerald-500";
    } else if (totalScore < 50) {
      label = "Under Review";
      color = "text-red-600";
      ringColor = "stroke-red-500";
    }

    return { score: totalScore, stars, label, color, ringColor };
  };

  // Load issues from localStorage safely
  useEffect(() => {
    if (typeof window !== "undefined" && authUser) {
      const stored = localStorage.getItem("civic_issues");
      const allIssues = stored ? JSON.parse(stored) : [];
      const userIssues = getPrioritizedIssues(allIssues, authUser.name);
      setIssues(userIssues);
      setPerformance(calculatePerformance(userIssues));
    }
  }, [authUser]);

  // Real-time cross-tab notification
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === "civic_issues") {
        if (typeof window !== "undefined" && authUser) {
          const stored = localStorage.getItem("civic_issues");
          const allIssues = stored ? JSON.parse(stored) : [];
          const userIssues = getPrioritizedIssues(allIssues, authUser.name);
          setIssues(userIssues);
          setPerformance(calculatePerformance(userIssues));
          setNewIssueNotification(true);
          setTimeout(() => setNewIssueNotification(false), 5000);
        }
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [authUser]);

  // Metrics
  const total = issues.length;
  const pending = issues.filter((i) => i.status === "Pending").length;
  const resolved = issues.filter((i) => i.status === "Resolved").length;

  // Assign Official
  const handleAssign = (id: number) => {
    if (!authUser) return;

    const stored = localStorage.getItem("civic_issues");
    const allIssues = stored ? JSON.parse(stored) : [];

    const updatedAll = allIssues.map((issue: any) =>
      issue.id === id ? { ...issue, assignedName: authUser.name, assignedPhone: authUser.phone } : issue
    );

    localStorage.setItem("civic_issues", JSON.stringify(updatedAll));
    const userIssues = getPrioritizedIssues(updatedAll, authUser.name);
    setIssues(userIssues);
    setPerformance(calculatePerformance(userIssues));
  };

  // Mark Resolved
  const handleResolve = (id: number) => {
    const stored = localStorage.getItem("civic_issues");
    const allIssues = stored ? JSON.parse(stored) : [];

    const updatedAll = allIssues.map((issue: any) =>
      issue.id === id ? { ...issue, status: "Resolved", resolvedAt: Date.now() } : issue
    );

    localStorage.setItem("civic_issues", JSON.stringify(updatedAll));
    const userIssues = getPrioritizedIssues(updatedAll, authUser.name);
    setIssues(userIssues);
    setPerformance(calculatePerformance(userIssues));
  };

  // Add Note
  const handleAddNote = (id: number) => {
    const note = window.prompt("Enter update note for citizen:");
    if (note === null || note.trim() === "") return;

    const stored = localStorage.getItem("civic_issues");
    const allIssues = stored ? JSON.parse(stored) : [];

    const updatedAll = allIssues.map((issue: any) =>
      issue.id === id ? { ...issue, authorityNote: note } : issue
    );

    localStorage.setItem("civic_issues", JSON.stringify(updatedAll));
    const userIssues = getPrioritizedIssues(updatedAll, authUser.name);
    setIssues(userIssues);
    setPerformance(calculatePerformance(userIssues));
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      window.alert("Performance Report successfully sent to Municipal HQ (Finance Dept).");
      setExporting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4">
      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full max-h-full flex justify-center" onClick={(e) => e.stopPropagation()}>
             <img src={selectedImage} alt="Full Evidence" className="max-h-[90vh] rounded-md shadow-2xl" />
             <button onClick={() => setSelectedImage(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300 text-lg font-bold">Close ✕</button>
          </div>
        </div>
      )}

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
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold text-sm">Welcome, {authUser.name}</span>
            <div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-200">
              <span className="text-yellow-600 text-xs font-bold">⭐ {performance.stars}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="w-full max-w-6xl mb-6 flex border-b border-slate-300">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'dashboard' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Dashboard & Metrics
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'feedback' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Citizen Feedback
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <>
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

      {/* Performance & Feedback Section */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Official Performance Scorecard */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm border border-slate-300 p-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
          
          {/* Circular Progress */}
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" 
                strokeDasharray={440} 
                strokeDashoffset={440 - (440 * performance.score) / 100} 
                className={`${performance.ringColor} transition-all duration-1000 ease-out`} 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${performance.color}`}>{performance.score}</span>
              <span className="text-xs text-slate-500 uppercase font-semibold">Index</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col gap-2 w-full">
            <h3 className="text-xl font-bold text-slate-800">Governance Index</h3>
            <div className={`text-lg font-semibold ${performance.color} mb-2`}>{performance.label}</div>
            <p className="text-sm text-slate-600 mb-4">
              Your score is calculated based on efficiency, public trust (likes/dislikes), and resolution speed.
            </p>
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2 w-fit"
            >
              {exporting ? "Sending..." : "📥 Export Performance Report for Payroll"}
            </button>
          </div>
        </div>

        {/* Citizen Feedback Widget */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-300 p-4 flex flex-col h-full">
          <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide border-b border-slate-100 pb-2">Latest Citizen Feedback</h3>
          <div className="flex-1 overflow-y-auto max-h-[200px] flex flex-col gap-3 pr-1">
            {issues.flatMap(i => (i.comments || []).map((c: any) => ({...c, issueType: i.issueType})))
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 3)
              .map((comment: any, idx: number) => (
                <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                  <div className="font-semibold text-slate-900 mb-1">{comment.issueType}</div>
                  <p className="text-slate-600 italic">"{comment.text}"</p>
                </div>
              ))}
            {issues.flatMap(i => i.comments || []).length === 0 && (
              <div className="text-slate-400 text-xs text-center py-4">No feedback yet.</div>
            )}
          </div>
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
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">Evidence</th>
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">Priority</th>
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">Status</th>
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">Assigned To</th>
              <th className="px-3 py-2 text-left text-sm font-semibold border-b border-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-slate-400 py-8">No tasks assigned to your department.</td>
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
                    {issue.imagePreview ? (
                      <div className="flex flex-col items-start gap-1">
                        <img 
                          src={issue.imagePreview} 
                          alt="Evidence" 
                          className="w-16 h-16 object-cover rounded-md cursor-pointer border border-slate-300 hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(issue.imagePreview)}
                        />
                        <button onClick={() => setSelectedImage(issue.imagePreview)} className="text-xs text-blue-600 hover:underline font-medium">
                          View Full Size
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">No image provided</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b border-slate-200">
                    {issue.priority === "High" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 animate-pulse">
                        High
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Normal
                      </span>
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
      </>
      ) : (
        <div className="w-full max-w-6xl flex flex-col gap-4">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Citizen Reviews & Feedback</h3>
          {issues.flatMap(i => (i.comments || []).map((c: any) => ({...c, issueId: i.id, issueType: i.issueType}))).length === 0 ? (
            <div className="text-slate-500 italic">No feedback received yet.</div>
          ) : (
            issues.flatMap(i => (i.comments || []).map((c: any) => ({...c, issueId: i.id, issueType: i.issueType})))
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((comment: any, idx: number) => (
                <div key={idx} className="bg-white p-4 rounded-sm shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-slate-900">Re: {comment.issueType} (ID: {comment.issueId})</span>
                    <span className="text-xs text-slate-500">{new Date(comment.date).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700">"{comment.text}"</p>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
