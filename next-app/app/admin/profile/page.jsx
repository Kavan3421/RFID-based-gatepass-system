"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { adminLogout } from "@/store/adminSlice";
import { ShieldCheck, Mail, LogOut, Key } from "lucide-react";

export default function AdminProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentAdmin } = useSelector((state) => state.admin);

  if (!currentAdmin) {
    if (typeof window !== "undefined") router.push("/admin/auth");
    return null;
  }

  const handleLogout = () => {
    dispatch(adminLogout());
    router.push("/admin/auth");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white">Administrator Profile</h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          Gatify security console administrator credentials
        </p>
      </div>

      <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-blue-600/40 border border-cyan-400/40 p-0.5 shadow-xl flex items-center justify-center text-cyan-300">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{currentAdmin.name || "Administrator"}</h2>
            <p className="text-xs text-cyan-400 font-mono font-bold">Role: Gatify Security Admin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl glass-sheet space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> Email Address
            </span>
            <p className="font-bold text-white">{currentAdmin.email}</p>
          </div>

          <div className="p-4 rounded-2xl glass-sheet space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" /> Clearance Level
            </span>
            <p className="font-bold text-emerald-300 font-mono">LEVEL 1 FULL ACCESS</p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 spring-press transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Admin Console
          </button>
        </div>
      </div>
    </div>
  );
}
