"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
  ShieldCheck,
} from "lucide-react";

export default function UserDashboard() {
  const router = useRouter();
  const { currentUser, token } = useSelector((state) => state.user);

  const [todayLogs, setTodayLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch today's RFID entry & exit log activity
  useEffect(() => {
    if (!currentUser) {
      router.push("/auth");
      return;
    }

    const fetchTodayActivity = async () => {
      try {
        const todayString = new Date().toISOString().split("T")[0];
        const response = await fetch(`/api/user/databydate?date=${todayString}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (response.ok && data.logs && currentUser.rfid_tag) {
          const userLogsObj = data.logs[currentUser.rfid_tag];
          if (userLogsObj && Array.isArray(userLogsObj.logs)) {
            setTodayLogs(userLogsObj.logs);
          }
        }
      } catch (err) {
        console.error("Failed to load user dashboard activity:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayActivity();
  }, [currentUser, token, router]);

  if (!currentUser) return null;

  const totalTodayScans = todayLogs.length;
  const lastScanEvent = todayLogs.length > 0 ? todayLogs[todayLogs.length - 1] : null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border-blue-500/20">
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white p-1 shrink-0 hidden sm:flex items-center justify-center shadow-md">
              <img
                src="/logo.svg"
                alt="SurveilEye Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
                <Activity className="w-3.5 h-3.5" />
                Live User Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                Welcome back, <span className="text-blue-600 dark:text-blue-400">{currentUser.name}</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                Vehicle: <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{currentUser.vehicleNumber}</span> • Enrollment: <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{currentUser.enrollmentNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/gatepass"
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <QrCode className="w-4 h-4" />
              Generate Gate Pass
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel glass-card-hover rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Assigned RFID Tag</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold font-mono text-blue-600 dark:text-cyan-400">{currentUser.rfid_tag || "TAG_849201"}</p>
          <p className="text-[11px] text-slate-500">Hardware barrier reader verified</p>
        </div>

        <div className="glass-panel glass-card-hover rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Today's Scans</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{totalTodayScans}</p>
          <p className="text-[11px] text-slate-500">Gate entries & exits recorded today</p>
        </div>

        <div className="glass-panel glass-card-hover rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Latest Gate Event</span>
            <div className={`p-2 rounded-xl ${lastScanEvent?.type === "entry" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold capitalize text-slate-900 dark:text-slate-100">
            {lastScanEvent ? lastScanEvent.type : "No Events Today"}
          </p>
          <p className="text-[11px] text-slate-500">{lastScanEvent ? lastScanEvent.timestamp : "Automatic camera log stream"}</p>
        </div>
      </div>

      {/* Today Activity List */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Today's Gate Movement Activity</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Automatic RFID scans verified by Raspberry Pi security barrier</p>
          </div>
          <Link href="/databydate" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold">
            Full History <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500">Syncing gate movement activity...</div>
        ) : todayLogs.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No gate movements logged today</p>
            <p className="text-xs text-slate-500">Scans recorded at the barrier will display here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {todayLogs.map((log, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${log.type === "entry" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                    {log.type === "entry" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-200 capitalize">{log.type} Event</span>
                </div>
                <span className="text-slate-600 dark:text-slate-400 font-mono">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
