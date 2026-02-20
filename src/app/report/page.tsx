"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const ISSUE_TYPES = [
  "Pothole",
  "Water Leakage",
  "Broken Streetlight",
  "Garbage",
];

export default function ReportPage() {
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [searchId, setSearchId] = useState("");
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [citizenName, setCitizenName] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("civic_issues");
      const loadedIssues = stored ? JSON.parse(stored) : [];
      setIssues(loadedIssues);
      setFilteredIssues(loadedIssues);
      // Autofill citizen identity if available
      const citizen = localStorage.getItem("current_citizen");
      if (citizen) {
        try {
          const parsed = JSON.parse(citizen);
          setCitizenName(parsed.name || "");
          setCitizenPhone(parsed.phone || "");
        } catch {}
      }
      // Load rewards
      const rewards = localStorage.getItem("citizen_rewards");
      setRewardPoints(rewards ? parseInt(rewards, 10) : 0);
    }
  }, []);

  useEffect(() => {
    if (!searchId.trim()) {
      setFilteredIssues(issues);
    } else {
      setFilteredIssues(issues.filter((issue) => String(issue.id) === searchId.trim()));
    }
  }, [searchId, issues]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMedia(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setMediaPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const authorities = [
      { name: 'Rajesh (Roads)', phone: '9876543210' },
      { name: 'Priya (Water)', phone: '9123456789' },
      { name: 'Amit (Sanitation)', phone: '9988776655' },
    ];
    let mediaUrl: string | null = null;
    if (mediaPreview) {
      mediaUrl = mediaPreview;
    }
    // Read current issues from localStorage for up-to-date workload
    let currentIssues: any[] = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("civic_issues");
      currentIssues = stored ? JSON.parse(stored) : [];
    }
    // Calculate workload for each authority
    const workload: Record<string, number> = {};
    authorities.forEach(a => { workload[a.name] = 0; });
    currentIssues.forEach(issue => {
      if (issue.assignedName && workload.hasOwnProperty(issue.assignedName)) {
        workload[issue.assignedName]++;
      }
    });
    // Find authority with lowest workload
    let min = Infinity;
    let selected = authorities[0];
    for (const a of authorities) {
      if (workload[a.name] < min) {
        min = workload[a.name];
        selected = a;
      }
    }
    const newIssue = {
      id: Date.now(),
      issueType,
      description,
      mediaUrl,
      coordinates: location, // ensure location is included
      status: "Pending",
      assignedName: selected.name,
      assignedPhone: selected.phone,
      citizenName,
      citizenPhone,
    };
    const updatedIssues = [...currentIssues, newIssue];
    setIssues(updatedIssues);
    if (typeof window !== "undefined") {
      localStorage.setItem("civic_issues", JSON.stringify(updatedIssues));
      localStorage.setItem("current_citizen", JSON.stringify({ name: citizenName, phone: citizenPhone }));
    }
    setIssueType(ISSUE_TYPES[0]);
    setDescription("");
    setMedia(null);
    setMediaPreview(null);
    setLocation(null); // Reset location after submit
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 4000);
    // Rewards logic
    const newPoints = rewardPoints + 50;
    setRewardPoints(newPoints);
    if (typeof window !== "undefined") {
      localStorage.setItem("citizen_rewards", String(newPoints));
    }
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    setLoadingLoc(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
          setLoadingLoc(false);
        },
        (err) => {
          window.alert('Location access denied or not secure. Please ensure you are on localhost or HTTPS. Using demo coordinates for submission.');
          setLocation({ lat: 28.6139, lng: 77.2090 }); // New Delhi fallback
          setIsLocating(false);
          setLoadingLoc(false);
        }
      );
    } else {
      window.alert('Geolocation is not supported by your browser. Using demo coordinates for submission.');
      setLocation({ lat: 28.6139, lng: 77.2090 });
      setIsLocating(false);
      setLoadingLoc(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 h-16 px-8 flex items-center shadow-sm z-10">
        <Link href="/" className="text-slate-900 font-bold text-base flex items-center gap-2 hover:underline">
          <span className="mr-2">←</span> Back to Home
        </Link>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto gap-8 pt-8 w-full px-4">
        {/* Left: Form */}
        <div className="lg:col-span-7 bg-white p-8 rounded-lg shadow-sm border border-slate-200 mb-8 lg:mb-0">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Report a Civic Issue</h2>
            <label className="text-slate-800 font-medium">Citizen Full Name</label>
            <input
              type="text"
              value={citizenName}
              onChange={e => setCitizenName(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-sm p-2 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="Your Name"
              required
            />
            <label className="text-slate-800 font-medium">Citizen Phone Number</label>
            <input
              type="tel"
              value={citizenPhone}
              onChange={e => setCitizenPhone(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-sm p-2 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="Your Phone Number"
              required
            />
            <label className="text-slate-800 font-medium">Issue Type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-sm p-2 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            >
              {ISSUE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <label className="text-slate-800 font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-sm p-2 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 min-h-[80px]"
              placeholder="Describe the issue..."
              required
            />

            <label className="text-slate-800 font-medium">Media Evidence</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              className="block w-full text-slate-800 border border-slate-300 rounded-sm p-2 bg-slate-100 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white"
            />
            {mediaPreview && (
              <div className="mt-2">
                {media?.type.startsWith("image") ? (
                  <img src={mediaPreview} alt="Preview" className="max-h-40 rounded-sm shadow-sm" />
                ) : (
                  <video src={mediaPreview} controls className="max-h-40 rounded-sm shadow-sm" />
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleGetLocation}
              className="bg-slate-900 text-white font-semibold rounded-sm px-4 py-2 flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-60"
              disabled={isLocating}
            >
              {isLocating ? '⏳ Fetching GPS...' : '📍 Get My Location'}
            </button>
            {location && (
              <div className="text-sm text-slate-900 mt-1">
                Location: Lat {location.lat.toFixed(5)}, Lng {location.lng.toFixed(5)}
              </div>
            )}
          
            <button
              type="submit"
              className="bg-slate-900 text-white font-bold rounded-sm px-4 py-2 mt-4 hover:bg-slate-800 transition-all"
            >
              Submit Issue
            </button>
            <div className="text-xs text-slate-500 mt-2">
              False reporting is punishable under municipal code section 402.A
            </div>
          </form>
        </div>

        {/* Right: Citizen Dashboard Panel */}
        <aside className="lg:col-span-5 flex flex-col gap-8">
          {/* Civic Rewards Wallet */}
          <div className="bg-slate-900 border-t-4 border-yellow-500 rounded-lg p-6 mb-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏆</span>
              <span className="text-lg font-bold">Civic Rewards Wallet</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-1">Balance: {rewardPoints} Points</div>
            <div className="text-base text-slate-200 mb-2">Value: ₹{rewardPoints}</div>
            <div className="text-xs text-slate-400 mb-4">Minimum 500 Points required for Direct Benefit Transfer (DBT) withdrawal.</div>
            <button
              disabled={rewardPoints < 500}
              className={`w-full mt-2 px-4 py-2 rounded-md font-semibold transition-all ${
                rewardPoints < 500
                  ? 'bg-slate-700 text-slate-300 opacity-50 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow'
              }`}
              onClick={() => {
                if (rewardPoints >= 500) {
                  window.alert('Success! ₹' + rewardPoints + ' has been transferred to your registered UPI ID via DBT.');
                  setRewardPoints(0);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("citizen_rewards", "0");
                  }
                }
              }}
            >
              {rewardPoints < 500 ? 'Reach 500 pts to Redeem' : 'Redeem to Bank/UPI'}
            </button>
          </div>

          {/* Live Map Visualizer */}
          <div>
            <h3 className="text-lg font-bold mb-4">Your Location</h3>
            {location ? (
              <iframe
                title="Citizen Location Map"
                className="w-full h-64 rounded-md border border-slate-700"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng-0.01},${location.lat-0.01},${location.lng+0.01},${location.lat+0.01}&layer=mapnik&marker=${location.lat},${location.lng}`}
                allowFullScreen
              />
            ) : (
              <div className="w-full h-64 bg-slate-800 rounded-md flex items-center justify-center border border-dashed border-slate-600 text-slate-400 text-sm">
                📍 Fetch location to view on map
              </div>
            )}
          </div>

          {/* Live City Activity Feed */}
          <div>
            <h3 className="text-lg font-bold mb-4">Recent City Activity</h3>
            {issues && issues.length > 0 ? (
              <div className="flex flex-col gap-3">
                {issues.slice().reverse().slice(0, 3).map((issue) => (
                  <div key={issue.id} className="bg-slate-800 rounded-md p-3 border border-slate-700 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100 text-xs">{issue.issueType}</span>
                      <span className={`px-2 py-0.5 rounded-sm text-xs font-bold ${
                        issue.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700 border border-yellow-400"
                          : "bg-green-100 text-green-700 border border-green-400"
                      }`}>
                        {issue.status}
                      </span>
                    </div>
                    <div className="text-slate-300 text-xs truncate">
                      {issue.description.length > 60 ? issue.description.slice(0, 60) + '…' : issue.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-xs">No recent activity.</div>
            )}
          </div>
        </aside>
      </div>

      {/* Tracking Section */}
      <div className="max-w-7xl mx-auto w-full px-4 mt-10">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Your Reported Issues</h3>
        {/* Search Bar */}
        <form
          onSubmit={e => { e.preventDefault(); }}
          className="flex items-center gap-2 mb-6"
        >
          <input
            type="text"
            placeholder="Track Specific Complaint by ID"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            className="flex-1 bg-slate-100 border border-slate-300 rounded-sm p-2 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          />
          <button
            type="button"
            onClick={() => setSearchId(searchId.trim())}
            className="bg-slate-900 text-white font-semibold rounded-sm px-4 py-2 hover:bg-slate-800 transition-all"
          >
            Search
          </button>
        </form>
        <div className="flex flex-col gap-4">
          {filteredIssues.length === 0 ? (
            <div className="text-slate-500 text-center">No issues reported yet.</div>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue.id} className="bg-white rounded-md border border-slate-200 shadow-sm p-4 flex flex-col gap-2 text-xs lg:text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{issue.issueType}</span>
                  <span
                    className={`px-2 py-1 rounded-sm text-xs font-bold ${
                      issue.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-400"
                        : "bg-green-100 text-green-700 border border-green-400"
                    }`}
                  >
                    {issue.status}
                  </span>
                </div>
                <div className="text-slate-700">{issue.description}</div>
                {issue.mediaUrl && (
                  <div className="mt-2">
                    {issue.mediaUrl.startsWith("data:image") ? (
                      <img src={issue.mediaUrl} alt="Media" className="max-h-32 rounded-sm shadow-sm" />
                    ) : (
                      <video src={issue.mediaUrl} controls className="max-h-32 rounded-sm shadow-sm" />
                    )}
                  </div>
                )}
                {issue.coordinates && (
                  <div className="text-xs text-slate-500">
                    Location: Lat {issue.coordinates.lat.toFixed(5)}, Lng {issue.coordinates.lng.toFixed(5)}
                  </div>
                )}
                <div className="text-xs mt-2">
                  <span className="text-slate-900 font-medium">
                    Assigned to: {issue.assignedName} 📞 {issue.assignedPhone}
                  </span>
                </div>
                {issue.authorityNote && (
                  <div className="bg-slate-100 border-l-4 border-slate-900 text-slate-900 p-3 rounded-sm mt-2 text-xs font-medium">
                    <span className="block font-semibold mb-1">Message from Authority:</span>
                    {issue.authorityNote}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
