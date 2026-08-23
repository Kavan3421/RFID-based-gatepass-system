"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import CalendarPicker from "@/components/ui/CalendarPicker";
import { Calendar as CalendarIcon, Search, AlertCircle, Loader2, ArrowDownRight, ArrowUpRight, Radio } from "lucide-react";

export default function AdminDataByDatePage() {
  const router = useRouter();
  const { currentAdmin, adminToken } = useSelector((state) => state.admin);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [logsData, setLogsData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAdminLogs = async (dateStr) => {
    if (!currentAdmin || !adminToken) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/databydate?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch surveillance logs");
      }

      setLogsData(data.logs || {});
    } catch (err) {
      setError(err.message);
      setLogsData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentAdmin) {
      router.push("/admin/auth");
      return;
    }
    fetchAdminLogs(selectedDate);
  }, [currentAdmin, router]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    fetchAdminLogs(newDate);
  };

  if (!currentAdmin) return null;

  const rfidTags = Object.keys(logsData);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Gate Log Database</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Query gate barrier scans across campus entrance & exit points
          </p>
        </div>

        {/* Date Calendar Picker */}
        <div className="flex items-center gap-2">
          <CalendarPicker value={selectedDate} onChange={handleDateChange} />
          <button
            onClick={() => fetchAdminLogs(selectedDate)}
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

      {/* Grouped Logs Container */}
      <div className="space-y-6">
        {loading ? (
          <div className="glass-floating rounded-3xl p-16 flex items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            Querying log records for {selectedDate}...
          </div>
        ) : rfidTags.length === 0 ? (
          <div className="glass-floating rounded-3xl p-16 text-center space-y-3 shadow-2xl">
            <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-base font-bold text-slate-300">No logs found for {selectedDate}</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Select another date using the calendar picker above to search historical gate movements.
            </p>
          </div>
        ) : (
          rfidTags.map((tag) => {
            const tagLogs = logsData[tag].logs || [];
            const firstLog = tagLogs[0] || {};
            return (
              <div key={tag} className="glass-floating rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold font-mono text-xs">
                      RFID
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono">Tag ID: {tag}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <span>Owner: <strong className="text-white">{firstLog.name || "Unknown"}</strong></span>
                        •
                        <span>ID: <strong className="text-white">{firstLog.enrollmentNumber || "N/A"}</strong></span>
                      </p>
                    </div>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-full glass-pill text-cyan-300 self-start sm:self-auto font-mono font-medium">
                    {tagLogs.length} Activity Events
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tagLogs.map((item, idx) => (
                    <div key={idx} className="glass-plank rounded-2xl p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${
                          item.type === "entry" ? "glass-badge-emerald" : "glass-badge-ruby"
                        }`}>
                          {item.type === "entry" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <span className="font-bold capitalize text-white">{item.type}</span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">{item.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
