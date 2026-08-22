"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Building2, User, KeyRound, AlertCircle, CheckCircle2, ArrowRight, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organizationCode: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      // Store Auth Session in localStorage
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
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-800 bg-slate-950/80 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mx-auto flex items-center justify-center text-cyan-400">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Organization Sign In</h1>
          <p className="text-xs text-slate-400">Enter your Organization ID and credentials to access your portal.</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Organization ID */}
          <div className="space-y-1">
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
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors uppercase tracking-wider font-mono"
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
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
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
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
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
