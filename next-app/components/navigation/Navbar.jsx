"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme/ThemeContext";
import {
  ShieldCheck,
  QrCode,
  Truck,
  Building2,
  Lock,
  Sun,
  Moon,
  LogOut,
  User,
  Plus,
  Sparkles,
  Layers,
  ChevronRight
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("gatify_user") || localStorage.getItem("qrgp_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("gatify_token");
    localStorage.removeItem("gatify_user");
    localStorage.removeItem("qrgp_token");
    localStorage.removeItem("qrgp_user");
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="sticky top-3 z-50 max-w-7xl mx-auto px-4 sm:px-6 w-full">
      <div className="glass-floating rounded-3xl px-4 sm:px-6 py-3 flex items-center justify-between border-t border-white/20 shadow-2xl transition-all duration-300">
        {/* Brand Logo & SaaS Title */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/20 group-hover:scale-105 group-hover:shadow-cyan-500/40 transition-all border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 to-blue-600/30 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5 text-cyan-300 group-hover:rotate-6 transition-transform" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 tracking-tight whitespace-nowrap">
                Gatify
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono tracking-wider">
                OS
              </span>
            </div>
            <span className="text-[10px] block font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Spatial Gate & Visitor OS
            </span>
          </div>
        </Link>

        {/* Navigation Links & Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl glass-pill text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white spring-press"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {!user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/onboarding"
                className="btn-liquid-primary px-4 py-2 rounded-2xl text-white font-bold text-xs flex items-center gap-1.5 spring-press"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Deploy System</span>
                <span className="sm:hidden">Deploy</span>
              </Link>
              <Link
                href="/login"
                className="btn-liquid-secondary px-4 py-2 rounded-2xl text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 spring-press"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-500" />
                <span>Sign In</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex flex-col items-end text-right pr-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{user.username}</span>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-mono font-bold tracking-wide">
                  {user.role} • {user.organizationCode}
                </span>
              </div>

              {user.role === "ADMIN" && (
                <Link
                  href="/admin/dashboard"
                  className="btn-liquid-primary px-3.5 py-2 rounded-2xl text-white text-xs font-bold flex items-center gap-1.5 spring-press"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin Hub</span>
                </Link>
              )}
              {user.role === "GATEKEEPER" && (
                <Link
                  href="/gatekeeper"
                  className="btn-liquid-primary px-3.5 py-2 rounded-2xl text-white text-xs font-bold flex items-center gap-1.5 spring-press"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gatekeeper Hub</span>
                </Link>
              )}
              {user.role === "MEMBER" && (
                <Link
                  href="/member"
                  className="btn-liquid-primary px-3.5 py-2 rounded-2xl text-white text-xs font-bold flex items-center gap-1.5 spring-press"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Member Portal</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 spring-press transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
