"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { ShieldCheck, Car, ArrowRight, Zap, CheckCircle2, Lock } from "lucide-react";

export default function Home() {
  const { currentUser } = useSelector((state) => state.user);
  const { currentAdmin } = useSelector((state) => state.admin);

  return (
    <div className="flex flex-col items-center justify-center py-8 lg:py-16 space-y-12 text-center">
      {/* Hero Section */}
      <div className="max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-semibold shadow-sm">
          <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          RFID & QR Gate Access Security System v2.0
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Automated Vehicle Access &{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 dark:from-blue-400 dark:via-cyan-300 dark:to-emerald-400 bg-clip-text text-transparent">
            Real-Time Surveillance
          </span>
        </h1>

        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Streamline campus vehicle entry & exit using automated RFID authentication, camera verification, and instant QR visitor gate passes.
        </p>
      </div>

      {/* Portal Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* User Portal Card */}
        <div className="glass-panel glass-card-hover rounded-3xl p-8 text-left flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User & Resident Portal</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                View vehicle movement logs, manage account details, and request visitor QR gate passes.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated RFID Entry Logs
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Visitor Pass QR Code Generator
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Direct Support & Feedback Form
              </li>
            </ul>
          </div>

          <Link
            href={currentUser ? "/dashboard" : "/auth"}
            className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            {currentUser ? "Go to Dashboard" : "User Sign In / Sign Up"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Admin Portal Card */}
        <div className="glass-panel glass-card-hover rounded-3xl p-8 text-left flex flex-col justify-between space-y-6 relative overflow-hidden group border-cyan-500/30">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />

          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Command Center</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Real-time gate surveillance, date-based RFID log search, and gatepass request verification.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-500" /> Live Gate Activity Stream
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-500" /> Vehicle Enrollment Lookup
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-500" /> Gatepass Approval Records
              </li>
            </ul>
          </div>

          <Link
            href={currentAdmin ? "/admin/dashboard" : "/admin/auth"}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all"
          >
            <Lock className="w-4 h-4" />
            {currentAdmin ? "Admin Control Hub" : "Admin Authorization"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
