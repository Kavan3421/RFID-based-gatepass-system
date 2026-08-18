"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { logout } from "@/store/userSlice";
import { Car, Mail, Hash, ShieldCheck, LogOut, Key } from "lucide-react";

export default function UserProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

  if (!currentUser) {
    if (typeof window !== "undefined") router.push("/auth");
    return null;
  }

  const handleLogout = () => {
    dispatch(logout());
    router.push("/auth");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">User Profile</h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          Registered vehicle details and security token claims
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-xl">
            <div className="w-full h-full bg-slate-100 dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-blue-600 dark:text-cyan-400 text-xl font-bold">
              {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</h2>
            <p className="text-xs text-blue-600 dark:text-cyan-400 font-mono font-medium">Assigned RFID: {currentUser.rfid_tag || "TAG_849201"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Email Address
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{currentUser.email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Vehicle Plate No.
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100 font-mono">{currentUser.vehicleNumber}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Enrollment No.
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100 font-mono">{currentUser.enrollmentNumber}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Auth Status
            </span>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Authenticated User
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of User Account
          </button>
        </div>
      </div>
    </div>
  );
}
