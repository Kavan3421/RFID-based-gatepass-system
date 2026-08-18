"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HardwareScriptRunner from "@/components/admin/HardwareScriptRunner";
import { ShieldCheck, Activity, Users, ArrowUpRight, ArrowDownRight, RefreshCw, Radio } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { currentAdmin, adminToken } = useSelector((state) => state.admin);

  const [logsData, setLogsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState("");

  const fetchTodayAdminData = async () => {
    if (!currentAdmin || !adminToken) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/admin/databydate?date=${todayStr}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.ok && data.logs) {
        setLogsData(data.logs);
      } else {
        setLogsData({});
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentAdmin) {
      router.push("/admin/auth");
      return;
    }
    fetchTodayAdminData();
  }, [currentAdmin, adminToken, router]);

  if (!currentAdmin) return null;

  // Flatten logs for metrics computation
  const allLogsArray = Object.entries(logsData).flatMap(([tag, val]) =>
    val.logs.map((log) => ({ ...log, tag }))
  );

  const totalEntriesToday = allLogsArray.filter((l) => l.type === "entry").length;
  const totalExitsToday = allLogsArray.filter((l) => l.type === "exit").length;
  const activeRfidCount = Object.keys(logsData).length;

  return (
    <div className="space-y-10">
      {/* Admin Command Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border-cyan-500/30">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold border border-cyan-500/20">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-600 dark:text-cyan-400" />
              Live Security Command Center
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Security Command <span className="text-cyan-600 dark:text-cyan-400">Dashboard</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              Administrator: <span className="text-slate-900 dark:text-slate-200 font-semibold">{currentAdmin.name || "Admin"}</span> • Hardware Control Hub: <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">ONLINE</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTodayAdminData}
              className="py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all border border-slate-300 dark:border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync Feeds
            </button>
            <Link
              href="/admin/databydate"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all"
            >
              Search All Logs
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="glass-panel glass-card-hover rounded-2xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Today's Entries</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalEntriesToday}</p>
          <p className="text-[11px] text-slate-500">Verified vehicle entries</p>
        </div>

        <div className="glass-panel glass-card-hover rounded-2xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Today's Exits</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{totalExitsToday}</p>
          <p className="text-[11px] text-slate-500">Verified vehicle exits</p>
        </div>

        <div className="glass-panel glass-card-hover rounded-2xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Active RFID Tags</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">{activeRfidCount}</p>
          <p className="text-[11px] text-slate-500">Unique tags scanned today</p>
        </div>

        <div className="glass-panel glass-card-hover rounded-2xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Last Synced</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-200">{lastRefreshed || "Just Now"}</p>
          <p className="text-[11px] text-slate-500">MongoDB change stream active</p>
        </div>
      </div>

      {/* Hardware Script Runner & Terminal Console */}
      <HardwareScriptRunner />

      {/* Real-time Activity Stream */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live RFID Gate Log Monitoring</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Real-time authentication records from entrance & exit barriers</p>
          </div>
          <Link href="/admin/databydate" className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold">
            Date Filter Logs <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Syncing live RFID surveillance feed...</div>
        ) : allLogsArray.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No gate activity logged today yet</p>
            <p className="text-xs text-slate-500">Scans captured by Raspberry Pi camera and RFID readers will appear here instantly.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">RFID Tag</th>
                  <th className="py-3 px-4">Owner Name</th>
                  <th className="py-3 px-4">Enrollment No.</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {allLogsArray.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] ${
                        log.type === "entry" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-600 dark:text-cyan-400">{log.tag}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">{log.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{log.enrollmentNumber}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-300">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
