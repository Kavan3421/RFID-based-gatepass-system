"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    organizationCode: "",
    usernameOrEmail: "",
    resetToken: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");
    if (tokenParam) {
      setForm((prev) => ({ ...prev, resetToken: tokenParam, usernameOrEmail: emailParam || "" }));
      setStep(2);
    }
  }, [searchParams]);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST",
          organizationCode: form.organizationCode,
          usernameOrEmail: form.usernameOrEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send reset code.");
      }

      setMessage({ type: "success", text: data.message });
      setStep(2);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONFIRM",
          organizationCode: form.organizationCode,
          email: form.usernameOrEmail,
          resetToken: form.resetToken,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setMessage({ type: "success", text: data.message });
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-elevated rounded-2xl p-6 sm:p-8 space-y-6 text-left">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-teal-500/15 mx-auto flex items-center justify-center text-teal-400">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="text-sm text-[var(--text-secondary)]">We’ll email an OTP to your admin account.</p>
      </div>

      {message.text && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            message.type === "success"
              ? "glass-badge-emerald"
              : "glass-badge-ruby"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRequestCode} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Organization ID</label>
            <input
              type="text"
              required
              placeholder="e.g. GVS1024"
              value={form.organizationCode}
              onChange={(e) => setForm({ ...form, organizationCode: e.target.value.toUpperCase() })}
              className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm uppercase tracking-wider font-mono focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Admin Email or Username</label>
            <input
              type="text"
              required
              placeholder="admin@organization.com"
              value={form.usernameOrEmail}
              onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-liquid-primary w-full py-4 px-4 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 spring-press disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Send Reset Code via Email"}
            <Mail className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirmReset} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">6-Digit Security Reset Code (OTP)</label>
            <input
              type="text"
              required
              placeholder="Enter 6-digit OTP"
              value={form.resetToken}
              onChange={(e) => setForm({ ...form, resetToken: e.target.value })}
              className="glass-input w-full px-4 py-3.5 rounded-2xl text-cyan-300 font-mono text-xl font-black tracking-widest text-center focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">New Secret Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-liquid-primary w-full py-4 px-4 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 spring-press disabled:opacity-50"
          >
            {loading ? "Updating..." : "Set New Password"}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading security form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
