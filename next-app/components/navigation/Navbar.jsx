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
  Menu,
  X,
  LogOut,
  User,
  Plus
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("qrgp_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("qrgp_token");
    localStorage.removeItem("qrgp_user");
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 glass-nav-bar px-4 lg:px-8 py-3 flex items-center justify-between">
      {/* Brand Logo & SaaS Title */}
      <Link href="/" className="flex items-center gap-3 group shrink-0">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform border border-cyan-500/30 bg-slate-950 flex items-center justify-center shrink-0">
          <QrCode className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="text-left">
          <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 tracking-tight whitespace-nowrap">
            QR GATE PASS
          </span>
          <span className="text-[10px] block font-semibold text-slate-400 whitespace-nowrap">
            Digital Gate & Visitor SaaS
          </span>
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {!user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/onboarding"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Get Your System
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Sign In
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-white">{user.username}</span>
              <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                {user.role} ({user.organizationCode})
              </span>
            </div>

            {user.role === "ADMIN" && (
              <Link href="/admin/dashboard" className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-md">
                Admin Hub
              </Link>
            )}
            {user.role === "GATEKEEPER" && (
              <Link href="/gatekeeper" className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-md">
                Gatekeeper Portal
              </Link>
            )}
            {user.role === "MEMBER" && (
              <Link href="/member" className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-md">
                Member Portal
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
