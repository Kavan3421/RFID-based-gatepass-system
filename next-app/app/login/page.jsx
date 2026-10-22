"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User, KeyRound, AlertCircle, ArrowRight, Mail, QrCode, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organizationCode: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("gatify_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.classList.toggle("light", savedTheme === "light");
  }, []);

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

      localStorage.setItem("gatify_token", data.token);
      localStorage.setItem("gatify_user", JSON.stringify(data.user));
      localStorage.setItem("qrgp_token", data.token);
      localStorage.setItem("qrgp_user", JSON.stringify(data.user));

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
      setError(err.message || "Invalid organization ID or credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[72vh] py-6 px-4">
      <div className="w-full max-w-md glass-elevated liquid-glass-surface rounded-3xl p-6 sm:p-9 space-y-6 shadow-2xl border-[1.2px]">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-cyan-400/15 border border-cyan-400/30 mx-auto flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <QrCode className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Gatify Sign In
          </h1>
          <p className="text-xs sm:text-sm text-white/70">
            Enter your organization code and credentials to access gate operations.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              Organization Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. GVS1024"
              value={form.organizationCode}
              onChange={(e) => setForm({ ...form, organizationCode: e.target.value.toUpperCase() })}
              className="glass-input w-full px-4 py-3 rounded-xl uppercase tracking-wider font-mono text-sm text-white focus:border-cyan-400 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Username
            </label>
            <input
              type="text"
              required
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm text-white focus:border-cyan-400 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                Password
              </label>
              <Link href="/reset-password" className="text-xs font-medium text-cyan-300 hover:text-cyan-200 hover:underline flex items-center gap-1">
                <Mail className="w-3 h-3" /> Forgot?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm text-white focus:border-cyan-400 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-liquid-primary liquid-touch-spring w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating..." : "Sign into Gatify"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-xs sm:text-sm text-center text-[var(--text-secondary)] border-t border-white/10 pt-4">
          Need to onboard your campus?{" "}
          <Link href="/onboarding" className="text-teal-400 font-semibold hover:underline">
            Register Organization
          </Link>
        </p>
      </div>
    </div>
  );
}
