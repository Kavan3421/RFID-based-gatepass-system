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
        <h1 className="text-3xl font-bold tracking-tight text-white">User Profile</h1>
        <p className="text-white/70 text-xs sm:text-sm">
          Registered vehicle details and security token claims
        </p>
      </div>

      <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-cyan-400/20 border border-cyan-400/30 p-0.5 shadow-xl">
            <div className="w-full h-full bg-white/10 rounded-[14px] flex items-center justify-center text-cyan-300 text-xl font-bold">
              {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{currentUser.name}</h2>
            <p className="text-xs text-cyan-300 font-mono font-medium">Assigned RFID: {currentUser.rfid_tag || "TAG_849201"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-white/70 font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-300" /> Email Address
            </span>
            <p className="font-semibold text-white">{currentUser.email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-white/70 font-medium flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-cyan-300" /> Vehicle Plate No.
            </span>
            <p className="font-semibold text-white font-mono">{currentUser.vehicleNumber}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-white/70 font-medium flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-400" /> Enrollment No.
            </span>
            <p className="font-semibold text-white font-mono">{currentUser.enrollmentNumber}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-white/70 font-medium flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-300" /> Auth Status
            </span>
            <p className="font-semibold text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Authenticated User
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of User Account
          </button>
        </div>
      </div>
    </div>
  );
}
