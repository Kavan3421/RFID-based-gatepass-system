"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import CalendarPicker from "@/components/ui/CalendarPicker";
import { Calendar as CalendarIcon, Search, AlertCircle, Loader2, ArrowDownRight, ArrowUpRight } from "lucide-react";

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">Surveillance Log Database</h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Query all RFID tag scans across campus entrance & exit barriers
          </p>
        </div>

        {/* Date Calendar Picker */}
        <div className="flex items-center gap-2">
          <CalendarPicker value={selectedDate} onChange={handleDateChange} />
          <button
            onClick={() => fetchAdminLogs(selectedDate)}
            className="p-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grouped Logs Container */}
      <div className="space-y-6">
        {loading ? (
          <div className="glass-panel rounded-3xl p-16 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
            Querying RFID log records for {selectedDate}...
          </div>
        ) : rfidTags.length === 0 ? (
          <div className="glass-panel rounded-3xl p-16 text-center space-y-3">
            <CalendarIcon className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-base font-semibold text-slate-800 dark:text-slate-300">No logs found for {selectedDate}</p>
            <p className="text-xs text-slate-600 dark:text-slate-500 max-w-sm mx-auto">
              Select another date using the calendar picker above to search historical gate scans.
            </p>
          </div>
        ) : (
          rfidTags.map((tag) => {
            const tagLogs = logsData[tag].logs || [];
            const firstLog = tagLogs[0] || {};
            return (
              <div key={tag} className="glass-panel rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold font-mono">
                      RFID
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">Tag ID: {tag}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span>Owner: <strong className="text-slate-900 dark:text-slate-200">{firstLog.name || "Unknown"}</strong></span>
                        •
                        <span>Enrollment: <strong className="text-slate-900 dark:text-slate-200">{firstLog.enrollmentNumber || "N/A"}</strong></span>
                      </p>
                    </div>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 self-start sm:self-auto font-mono font-medium">
                    {tagLogs.length} Activity Events
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tagLogs.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/70 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${
                          item.type === "entry" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                          {item.type === "entry" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <span className="font-bold capitalize text-slate-900 dark:text-slate-200">{item.type}</span>
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">{item.timestamp}</span>
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
