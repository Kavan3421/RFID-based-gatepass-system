"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import CalendarPicker from "@/components/ui/CalendarPicker";
import { Calendar as CalendarIcon, Search, FileText, User, Hash, Clock, AlertCircle, Loader2 } from "lucide-react";

export default function AdminPassByDatePage() {
  const router = useRouter();
  const { currentAdmin, adminToken } = useSelector((state) => state.admin);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [logsData, setLogsData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPassLogs = async (dateStr) => {
    if (!currentAdmin || !adminToken) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/passbydate?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch gatepass logs");
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
    fetchPassLogs(selectedDate);
  }, [currentAdmin, router]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    fetchPassLogs(newDate);
  };

  if (!currentAdmin) return null;

  const rfidTags = Object.keys(logsData);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">Visitor Gate Pass Logs</h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Review registered visitor pass requests and reason logs by date
          </p>
        </div>

        {/* Date Calendar Picker */}
        <div className="flex items-center gap-2">
          <CalendarPicker value={selectedDate} onChange={handleDateChange} />
          <button
            onClick={() => fetchPassLogs(selectedDate)}
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

      <div className="space-y-6">
        {loading ? (
          <div className="glass-panel rounded-3xl p-16 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
            Querying gatepass records for {selectedDate}...
          </div>
        ) : rfidTags.length === 0 ? (
          <div className="glass-panel rounded-3xl p-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-base font-semibold text-slate-800 dark:text-slate-300">No gate pass logs found for {selectedDate}</p>
            <p className="text-xs text-slate-600 dark:text-slate-500 max-w-sm mx-auto">
              Select another date using the calendar picker above to search visitor pass records.
            </p>
          </div>
        ) : (
          rfidTags.map((tag) => {
            const passes = logsData[tag].logs || [];
            return (
              <div key={tag} className="glass-panel rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">RFID Tag: {tag}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Visitor Passes Logged: {passes.length}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {passes.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> {item.name}
                        </span>
                        <span className="font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {item.enrollmentNumber}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-300">
                        <p className="text-slate-500 font-medium text-[11px] mb-1">Reason for Visit:</p>
                        <p className="font-medium leading-relaxed">{item.reason}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Slot: <strong className="text-slate-900 dark:text-slate-200">{item.time}</strong>
                        </span>
                      </div>
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
