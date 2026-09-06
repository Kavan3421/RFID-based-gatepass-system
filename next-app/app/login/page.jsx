"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User, KeyRound, AlertCircle, ArrowRight, Mail, QrCode } from "lucide-react";

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
    <div className="flex items-center justify-center min-h-[70vh] py-6">
      <div className="w-full max-w-md glass-elevated rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-teal-500/15 mx-auto flex items-center justify-center text-teal-400">
            <QrCode className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-sm text-[var(--text-secondary)]">Use your organization ID and account details.</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-400" />
              Organization ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. GVS1024"
              value={form.organizationCode}
              onChange={(e) => setForm({ ...form, organizationCode: e.target.value.toUpperCase() })}
              className="glass-input w-full px-4 py-3 rounded-xl uppercase tracking-wide"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-400" />
              Username
            </label>
            <input
              type="text"
              required
              placeholder="Your username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-teal-400" />
                Password
              </label>
              <Link href="/reset-password" className="text-xs font-semibold text-teal-400 hover:underline flex items-center gap-1">
                <Mail className="w-3 h-3" /> Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-liquid-primary w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-sm text-center text-[var(--text-secondary)]">
          New community?{" "}
          <Link href="/onboarding" className="text-teal-400 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
