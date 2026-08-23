"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { adminLoginSuccess } from "@/store/adminSlice";
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2, QrCode } from "lucide-react";

export default function AdminAuthPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentAdmin } = useSelector((state) => state.admin);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (currentAdmin) {
      router.replace("/admin/dashboard");
    }
  }, [currentAdmin, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Admin authorization failed");
      }

      dispatch(adminLoginSuccess({ token: data.token, admin: data.admin }));
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (currentAdmin) return null;

  return (
    <div className="flex items-center justify-center min-h-[82vh] py-8">
      <div className="w-full max-w-md glass-floating rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl animate-in fade-in duration-200">
        <div className="text-center space-y-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 mx-auto flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Admin Command Console
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Restricted security authorization for Gatify system administrators
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Admin Email Address
            </label>
            <div className="flex items-center gap-3 glass-input rounded-2xl px-3.5 py-3 focus-within:border-cyan-400 transition-all">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="email"
                name="email"
                required
                placeholder="admin@organization.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Admin Security Password
            </label>
            <div className="flex items-center gap-3 glass-input rounded-2xl px-3.5 py-3 focus-within:border-cyan-400 transition-all">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-liquid-primary w-full py-4 mt-2 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 spring-press disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Authenticate Administrator
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
