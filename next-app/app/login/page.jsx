"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Building2, User, KeyRound, AlertCircle, CheckCircle2, ArrowRight, Mail, QrCode, Sparkles, Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organizationCode: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("gatify_theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.classList.toggle("light", savedTheme === "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("gatify_theme", next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to sign in.");
      }

      // Store Auth Session in localStorage with unified gatify_* keys and backward-compatible fallback
      localStorage.setItem("gatify_token", data.token);
      localStorage.setItem("gatify_user", JSON.stringify(data.user));
      localStorage.setItem("qrgp_token", data.token);
      localStorage.setItem("qrgp_user", JSON.stringify(data.user));

      // Role-Based Navigation Dispatch
      if (data.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (data.user.role === "GATEKEEPER") {
        router.push("/gatekeeper");
      } else if (data.user.role === "MEMBER") {
        router.push("/member");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err.message || "Invalid Organization ID or credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-md glass-floating rounded-3xl p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 relative">
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            type="button"
            className="p-2 rounded-xl glass-pill text-slate-400 hover:text-white spring-press"
            title={`Switch to ${theme === 'dark' ? 'Light Crystal' : 'Dark Obsidian'} Mode`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" /> : <Moon className="w-4 h-4 text-indigo-500 animate-in spin-in-180 duration-300" />}
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 mx-auto flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
            <QrCode className="w-7 h-7" />
          </div>
          <div className="pt-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Organization Sign In</h1>
            <p className="text-xs text-slate-400 mt-1">Enter your Gatify Organization ID and credentials</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Organization ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              Organization ID (e.g. GVS1024)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. GVS1024"
              value={form.organizationCode}
              onChange={(e) => setForm({ ...form, organizationCode: e.target.value.toUpperCase() })}
              className="glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-cyan-400 uppercase tracking-wider font-mono"
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Username
            </label>
            <input
              type="text"
              required
              placeholder="Your username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-cyan-400"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                Password
              </label>
              <Link
                href="/reset-password"
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <Mail className="w-3 h-3" /> Forgot Admin Password?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-liquid-primary w-full py-4 px-4 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 spring-press disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating..." : "Sign In to Gatify Portal"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-white/5">
          <p className="text-xs text-slate-400">
            Need to register a new community?{" "}
            <Link href="/onboarding" className="text-cyan-400 font-bold hover:underline">
              Deploy Gatify
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
