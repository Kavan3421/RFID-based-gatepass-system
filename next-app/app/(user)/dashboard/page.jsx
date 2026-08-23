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
  Sparkles
} from "lucide-react";

export default function UserDashboard() {
  const router = useRouter();
  const { currentUser, token } = useSelector((state) => state.user);

  const [todayLogs, setTodayLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch today's entry & exit log activity
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
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="glass-floating rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 p-1 shrink-0 hidden sm:flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <QrCode className="w-7 h-7 text-cyan-300" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge-cyan text-xs font-bold">
                <Activity className="w-3.5 h-3.5" />
                Live User Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome back, <span className="text-cyan-300">{currentUser.name}</span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                Vehicle: <span className="font-mono text-white font-bold">{currentUser.vehicleNumber}</span> • ID: <span className="font-mono text-white font-bold">{currentUser.enrollmentNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/gatepass"
              className="btn-liquid-primary w-full sm:w-auto py-3.5 px-6 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 spring-press"
            >
              <QrCode className="w-4 h-4" />
              Generate Gate Pass
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-elevated rounded-3xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Assigned Tag / Pass</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-cyan-300">{currentUser.rfid_tag || "GATIFY_TAG_849201"}</p>
          <p className="text-[11px] text-slate-500">Spatial gate barrier verified</p>
        </div>

        <div className="glass-elevated rounded-3xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Today's Movements</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{totalTodayScans}</p>
          <p className="text-[11px] text-slate-500">Gate entries & exits recorded today</p>
        </div>

        <div className="glass-elevated rounded-3xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Latest Gate Movement</span>
            <div className={`p-2 rounded-xl ${lastScanEvent?.type === "entry" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold capitalize text-white">
            {lastScanEvent ? lastScanEvent.type : "No Events Today"}
          </p>
          <p className="text-[11px] text-slate-500">{lastScanEvent ? lastScanEvent.timestamp : "Automatic log stream"}</p>
        </div>
      </div>

      {/* Today Activity List */}
      <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-white">Today's Gate Movement Activity</h2>
            <p className="text-xs text-slate-400">Automatic movement records verified by Gatify security barrier</p>
          </div>
          <Link href="/databydate" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-bold">
            Full History <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Syncing gate movement activity...</div>
        ) : todayLogs.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No gate movements logged today</p>
            <p className="text-xs text-slate-500">Scans recorded at the barrier will display here automatically.</p>
          </div>
        ) : (
          <div className="space-y-2.5 pt-2">
            {todayLogs.map((log, idx) => (
              <div key={idx} className="glass-plank p-4 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${log.type === "entry" ? "glass-badge-emerald" : "glass-badge-ruby"}`}>
                    {log.type === "entry" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <span className="font-bold text-white capitalize">{log.type} Movement</span>
                </div>
                <span className="text-slate-400 font-mono">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
