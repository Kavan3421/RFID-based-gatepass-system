"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  Play,
  Square,
  Terminal,
  Radio,
  Camera,
  LogOut,
  LogIn,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function HardwareScriptRunner() {
  const { adminToken } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState("read_tags_entry");
  const [scriptsStatus, setScriptsStatus] = useState({
    read_tags_entry: { running: false, pid: null, logs: [] },
    read_tags_exit: { running: false, pid: null, logs: [] },
    image_capture: { running: false, pid: null, logs: [] },
  });
  const [actionLoading, setActionLoading] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const terminalBoxRef = useRef(null);

  const scriptConfig = {
    read_tags_entry: {
      title: "Entry RFID Reader",
      file: "read_tags_entry.py",
      desc: "Monitors COM/Serial RFID scanner at entry gate & logs to MongoDB",
      icon: LogIn,
      badgeColor: "emerald",
    },
    read_tags_exit: {
      title: "Exit RFID Reader",
      file: "read_tags_exit.py",
      desc: "Monitors COM/Serial RFID scanner at exit gate & logs to MongoDB",
      icon: LogOut,
      badgeColor: "rose",
    },
    image_capture: {
      title: "Camera Image Capture",
      file: "image_capture.py",
      desc: "Detects new entry/exit DB logs & captures webcam/Pi photos",
      icon: Camera,
      badgeColor: "cyan",
    },
  };

  const fetchHardwareStatus = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch("/api/admin/hardware", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.ok && data.scripts) {
        setScriptsStatus(data.scripts);
      }
    } catch (err) {
      console.error("Failed to fetch hardware status:", err);
    }
  };

  useEffect(() => {
    fetchHardwareStatus();
    // Poll hardware log status every 2.5 seconds
    const interval = setInterval(fetchHardwareStatus, 2500);
    return () => clearInterval(interval);
  }, [adminToken]);

  // Auto-scroll ONLY the inner terminal box container (does NOT jump main page scroll)
  useEffect(() => {
    if (terminalBoxRef.current) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [scriptsStatus[activeTab]?.logs]);

  const handleAction = async (scriptKey, action) => {
    setActionLoading((prev) => ({ ...prev, [scriptKey]: true }));
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/hardware", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ script: scriptKey, action }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Hardware action failed");
      }

      await fetchHardwareStatus();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [scriptKey]: false }));
    }
  };

  const activeScriptLogs = scriptsStatus[activeTab]?.logs || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
            Hardware Script Controller & Terminal Console
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Start, stop, and stream real-time logs from entry/exit RFID readers and camera capture processes
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Script Cards Grid (3 Supported Scripts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.keys(scriptConfig).map((key) => {
          const cfg = scriptConfig[key];
          const st = scriptsStatus[key] || { running: false, pid: null };
          const isLoading = actionLoading[key];
          const Icon = cfg.icon;

          return (
            <div
              key={key}
              className={`glass-panel rounded-3xl p-5 space-y-4 transition-all border ${
                st.running
                  ? "border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700`}>
                    <Icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cfg.title}</h3>
                    <span className="text-[10px] font-mono text-slate-400">hardware/{cfg.file}</span>
                  </div>
                </div>

                {st.running ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> RUNNING
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700">
                    STOPPED
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 min-h-[32px] leading-relaxed">
                {cfg.desc}
              </p>

              {st.running && (
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/60">
                  <span>Process ID:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">PID {st.pid}</strong>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {!st.running ? (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleAction(key, "start")}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    Start Script
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleAction(key, "stop")}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-current" />}
                    Stop Process
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-semibold border transition-all ${
                    activeTab === key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Logs
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Log Console */}
      <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4 font-mono">
        {/* Terminal Header & Script Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">Terminal Log Console</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Live Output
            </span>
          </div>

          {/* Script Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
            {Object.keys(scriptConfig).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === key
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {scriptConfig[key].file}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleAction(activeTab, "clear_logs")}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Clear Console
          </button>
        </div>

        {/* Console Log Output Window (Inner container scroll only) */}
        <div
          ref={terminalBoxRef}
          className="h-64 overflow-y-auto space-y-1.5 text-[11px] pr-2 scrollbar-thin scrollbar-thumb-slate-800"
        >
          {activeScriptLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
              No log messages captured for hardware/{scriptConfig[activeTab]?.file} yet. Click "Start Script" to launch process.
            </div>
          ) : (
            activeScriptLogs.map((l, idx) => (
              <div key={idx} className="flex items-start gap-2.5 leading-relaxed hover:bg-slate-900/60 p-0.5 rounded">
                <span className="text-slate-500 shrink-0 font-mono text-[10px]">[{l.timestamp}]</span>
                <span
                  className={
                    l.type === "stderr" || l.type === "error"
                      ? "text-rose-400 font-semibold"
                      : l.type === "success"
                      ? "text-emerald-400 font-bold"
                      : "text-cyan-300"
                  }
                >
                  {l.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
