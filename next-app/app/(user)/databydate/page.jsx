"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import CalendarPicker from "@/components/ui/CalendarPicker";
import { Search, AlertCircle, Loader2, ArrowDownRight, ArrowUpRight, Calendar as CalendarIcon, ShieldCheck } from "lucide-react";

export default function UserDataByDatePage() {
  const router = useRouter();
  const { currentUser, token } = useSelector((state) => state.user);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [logsList, setLogsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLogs = async (dateStr) => {
    if (!currentUser || !token) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/user/databydate?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch log activity");
      }

      if (data.logs && currentUser.rfid_tag) {
        const userObj = data.logs[currentUser.rfid_tag];
        setLogsList(userObj ? userObj.logs || [] : []);
      } else {
        setLogsList([]);
      }
    } catch (err) {
      setError(err.message);
      setLogsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth");
      return;
    }
    fetchLogs(selectedDate);
  }, [currentUser, router]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    fetchLogs(newDate);
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gate Movement History
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Query your registered gate entry & exit records by date
          </p>
        </div>

        {/* Date Calendar Picker */}
        <div className="flex items-center gap-2">
          <CalendarPicker value={selectedDate} onChange={handleDateChange} />
          <button
            onClick={() => fetchLogs(selectedDate)}
            className="p-2.5 rounded-2xl btn-liquid-primary text-white text-xs font-semibold shadow-sm spring-press"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Card */}
      <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <span className="text-xs font-semibold text-slate-400">Query Tag / Pass:</span>
            <h3 className="text-base font-bold font-mono text-cyan-300">
              {currentUser.rfid_tag || "GATIFY_PASS_VERIFIED"}
            </h3>
          </div>
          <span className="text-xs font-mono font-medium px-3 py-1 rounded-full glass-pill text-white">
            Date: {selectedDate}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            Querying barrier logs for {selectedDate}...
          </div>
        ) : logsList.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No gate activity logged on {selectedDate}</p>
            <p className="text-xs text-slate-500">
              Select another date using the calendar picker above to review historical gate movements.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {logsList.map((item, idx) => (
              <div key={idx} className="glass-plank p-4 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${item.type === "entry" ? "glass-badge-emerald" : "glass-badge-ruby"}`}>
                    {item.type === "entry" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-white capitalize block">{item.type} Authentication</span>
                    <span className="text-[11px] text-slate-400 font-mono">Verified by Gatify Security Sensor</span>
                  </div>
                </div>
                <span className="font-mono text-slate-300 font-bold">{item.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
