"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess } from "@/store/userSlice";
import { Car, Lock, Mail, User, Hash, AlertCircle, Loader2, ArrowRight, QrCode } from "lucide-react";

export default function UserAuthPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    vehicleNumber: "",
    enrollmentNumber: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isSignUp ? "/api/user/signup" : "/api/user/signin";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      dispatch(loginSuccess({ token: data.token, user: data.user }));
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) return null;

  return (
    <div className="flex items-center justify-center min-h-[82vh] py-8">
      <div className="w-full max-w-md glass-floating rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl animate-in fade-in duration-200">
        {/* Header Branding */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 mx-auto flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isSignUp ? "Register Account" : "Gatify User Portal"}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              {isSignUp
                ? "Enroll your resident credentials for gate access"
                : "Sign in with your registered account credentials"}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 glass-sheet p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError("");
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all spring-press ${!isSignUp
                ? "btn-liquid-primary text-white shadow-sm"
                : "text-slate-400 hover:text-white"
              }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError("");
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all spring-press ${isSignUp
                ? "btn-liquid-primary text-white shadow-sm"
                : "text-slate-400 hover:text-white"
              }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Full Name
                </label>
                <div className="flex items-center gap-3 glass-input rounded-2xl px-3.5 py-3 focus-within:border-cyan-400 transition-all">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Kavan Patel"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Vehicle License Number
                </label>
                <div className="flex items-center gap-3 glass-input rounded-2xl px-3.5 py-3 focus-within:border-cyan-400 transition-all">
                  <Car className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    name="vehicleNumber"
                    required
                    placeholder="e.g. GJ07KP0510"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Enrollment / Unit ID
                </label>
                <div className="flex items-center gap-3 glass-input rounded-2xl px-3.5 py-3 focus-within:border-cyan-400 transition-all">
                  <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="number"
                    name="enrollmentNumber"
                    required
                    placeholder="e.g. 12202080701052"
                    value={formData.enrollmentNumber}
                    onChange={handleChange}
                    className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Email Address
            </label>
            <div className="flex items-center gap-3 glass-input rounded-2xl px-3.5 py-3 focus-within:border-cyan-400 transition-all">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="email"
                name="email"
                required
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Account Password
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
                <span>{isSignUp ? "Complete Registration" : "Sign In to Gatify"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
