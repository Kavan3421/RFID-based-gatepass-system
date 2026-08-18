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
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Administrator Profile</h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          System surveillance console control credentials
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border-cyan-500/30 relative overflow-hidden">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 shadow-xl">
            <div className="w-full h-full bg-slate-100 dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentAdmin.name || "Administrator"}</h2>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono font-medium">Role: Master Security Admin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Email Address
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{currentAdmin.email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Clearance Level
            </span>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">LEVEL 1 FULL ACCESS</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Admin Console
          </button>
        </div>
      </div>
    </div>
  );
}
