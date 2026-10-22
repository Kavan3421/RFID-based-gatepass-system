"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme/ThemeContext";
import {
  ShieldCheck,
  QrCode,
  Lock,
  Sun,
  Moon,
  LogOut,
  Plus,
  Layers,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("gatify_user") || localStorage.getItem("qrgp_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    } else {
      setUser(null);
    }
    setOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("gatify_token");
    localStorage.removeItem("gatify_user");
    localStorage.removeItem("qrgp_token");
    localStorage.removeItem("qrgp_user");
    setUser(null);
    router.push("/login");
  };

  const hubHref =
    user?.role === "ADMIN" ? "/admin/dashboard" : user?.role === "GATEKEEPER" ? "/gatekeeper" : "/member";
  const HubIcon = user?.role === "ADMIN" ? Layers : user?.role === "GATEKEEPER" ? ShieldCheck : QrCode;
  const hubLabel = user?.role === "ADMIN" ? "Admin" : user?.role === "GATEKEEPER" ? "Gate" : "Passes";

  return (
    <header className="sticky top-0 z-50 pt-2 sm:pt-3 px-2 sm:px-4">
      <div className="glass-nav-bar liquid-glass-surface max-w-6xl mx-auto px-4 sm:px-6 h-16 rounded-2xl flex items-center justify-between gap-3 border-[1.2px]">
        <Link href="/" className="flex items-center gap-2.5 min-w-0 liquid-touch-spring">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <QrCode className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold tracking-tight text-white">Gatify</div>
            <div className="hidden sm:block text-[11px] text-white/60 truncate">Spatial Access & Visitor OS</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 liquid-touch-spring"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {!user ? (
            <>
              <Link href="/onboarding" className="btn-liquid-secondary liquid-touch-spring px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Register
              </Link>
              <Link href="/login" className="btn-liquid-primary liquid-touch-spring px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                Sign in
              </Link>
            </>
          ) : (
            <>
              <div className="hidden lg:flex items-center gap-2 pr-2 text-right">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate max-w-[140px]">{user.username}</div>
                  <div className="text-[11px] text-white/60">{user.organizationCode}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-400/40'
                    : user.role === 'GATEKEEPER'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-400/40'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40'
                }`}>
                  {user.role}
                </span>
              </div>
              <Link href={hubHref} className="btn-liquid-primary liquid-touch-spring px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                <HubIcon className="w-4 h-4" />
                {hubLabel}
              </Link>
              <button onClick={handleLogout} className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 liquid-touch-spring" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggleTheme} className="p-2.5 rounded-xl border border-[var(--border)] bg-white/5 liquid-touch-spring">
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <button onClick={() => setOpen((v) => !v)} className="p-2.5 rounded-xl border border-[var(--border)] bg-white/5 liquid-touch-spring" aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden mt-2 glass-panel liquid-glass-surface border-[1.2px] rounded-2xl max-w-6xl mx-auto px-4 py-3 space-y-2">
          {!user ? (
            <>
              <Link href="/onboarding" className="btn-liquid-secondary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                Register organization
              </Link>
              <Link href="/login" className="btn-liquid-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                Sign in
              </Link>
            </>
          ) : (
            <>
              <div className="text-sm pb-1">
                <div className="font-semibold">{user.username}</div>
                <div className="text-xs text-teal-500">{user.role} · {user.organizationCode}</div>
              </div>
              <Link href={hubHref} className="btn-liquid-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                Open {hubLabel}
              </Link>
              <button onClick={handleLogout} className="w-full py-3 rounded-xl border border-rose-500/20 text-rose-400 text-sm font-semibold">
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
