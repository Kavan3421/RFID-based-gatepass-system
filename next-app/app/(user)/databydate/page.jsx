"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import CalendarPicker from "@/components/ui/CalendarPicker";
import { Search, AlertCircle, Loader2, ArrowDownRight, ArrowUpRight, Calendar as CalendarIcon } from "lucide-react";

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
        throw new Error(data.message || "Failed to fetch RFID log activity");
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            RFID Barrier Movement History
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Query your registered RFID tag entry & exit records by date
          </p>
        </div>

        {/* Date Calendar Picker */}
        <div className="flex items-center gap-2">
          <CalendarPicker value={selectedDate} onChange={handleDateChange} />
          <button
            onClick={() => fetchLogs(selectedDate)}
            className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
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

      {/* Logs Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-500">Query Target RFID Tag:</span>
            <h3 className="text-base font-bold font-mono text-blue-600 dark:text-cyan-400">
              {currentUser.rfid_tag || "TAG_UNASSIGNED"}
            </h3>
          </div>
          <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
            Date: {selectedDate}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
            Querying barrier logs for {selectedDate}...
          </div>
        ) : logsList.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <CalendarIcon className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No gate activity logged on {selectedDate}</p>
            <p className="text-xs text-slate-500">
              Select another date using the calendar picker above to review historical gate scans.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {logsList.map((item, idx) => (
              <div key={idx} className="py-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${item.type === "entry" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                    {item.type === "entry" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 capitalize block">{item.type} Authentication</span>
                    <span className="text-[11px] text-slate-500 font-mono">Barrier ID: GATE_SENSOR_01</span>
                  </div>
                </div>
                <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">{item.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
