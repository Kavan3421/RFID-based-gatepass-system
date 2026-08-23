"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Layers, User, Lock, CheckCircle2, ArrowRight, ShieldCheck, Mail, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    organizationName: "",
    organizationType: "society",
    destinationType: "flat_wing",
    adminUsername: "",
    adminEmail: "",
    adminPassword: "",
    tier: "GROWTH",
  });

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.adminEmail) {
      setError("Admin Email is COMPULSORY for organization registration.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to complete organization onboarding.");
      }

      setResult(data);
      localStorage.setItem("gatify_token", data.token);
      localStorage.setItem("gatify_user", JSON.stringify(data.user));
      localStorage.setItem("qrgp_token", data.token);
      localStorage.setItem("qrgp_user", JSON.stringify(data.user));
      setStep(3); // Success Screen
    } catch (err) {
      setError(err.message || "An onboarding error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <div className="w-full max-w-xl glass-floating rounded-3xl p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Wizard Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 mx-auto flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Deploy Your Organization</h1>
          <p className="text-xs text-slate-400">Deploy Gatify for your residential or commercial community.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
          <span className={`px-3.5 py-1.5 rounded-full transition-all ${step === 1 ? 'btn-liquid-primary text-white font-black' : 'glass-pill'}`}>
            1. Details
          </span>
          <span className="text-slate-600">→</span>
          <span className={`px-3.5 py-1.5 rounded-full transition-all ${step === 2 ? 'btn-liquid-primary text-white font-black' : 'glass-pill'}`}>
            2. Admin Account
          </span>
          <span className="text-slate-600">→</span>
          <span className={`px-3.5 py-1.5 rounded-full transition-all ${step === 3 ? 'bg-emerald-500 text-slate-950 font-black' : 'glass-pill'}`}>
            3. Confirmation
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-bold">
            {error}
          </div>
        )}

        {/* STEP 1: Organization & Destination Structure */}
        {step === 1 && (
          <div className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Organization / Society Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Green Valley Society"
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Organization Type</label>
                <select
                  value={form.organizationType}
                  onChange={(e) => setForm({ ...form, organizationType: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm focus:border-cyan-400"
                >
                  <option value="society" className="bg-slate-900 text-white">Residential Society</option>
                  <option value="apartment" className="bg-slate-900 text-white">Apartment Complex</option>
                  <option value="villa" className="bg-slate-900 text-white">Bungalow / Villa Community</option>
                  <option value="office" className="bg-slate-900 text-white">Corporate Office</option>
                  <option value="commercial" className="bg-slate-900 text-white">Commercial Building</option>
                  <option value="warehouse" className="bg-slate-900 text-white">Warehouse / Logistics</option>
                  <option value="school" className="bg-slate-900 text-white">School / College</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Destination Structure</label>
                <select
                  value={form.destinationType}
                  onChange={(e) => setForm({ ...form, destinationType: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm focus:border-cyan-400"
                >
                  <option value="flat_wing" className="bg-slate-900 text-white">Wing + Flat # (e.g. A-203)</option>
                  <option value="house_plot" className="bg-slate-900 text-white">House / Plot # (e.g. 104)</option>
                  <option value="villa" className="bg-slate-900 text-white">Villa # (e.g. Villa 12)</option>
                  <option value="department" className="bg-slate-900 text-white">Department (e.g. HR, IT)</option>
                  <option value="custom" className="bg-slate-900 text-white">Custom Labels</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!form.organizationName) return setError("Organization Name is required.");
                setError("");
                setStep(2);
              }}
              className="btn-liquid-primary w-full py-4 px-4 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 spring-press mt-2"
            >
              <span>Continue to Admin Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Admin Account Credentials */}
        {step === 2 && (
          <form onSubmit={handleCreateOrg} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Admin Username *</label>
              <input
                type="text"
                required
                placeholder="e.g. admin_greenvalley"
                value={form.adminUsername}
                onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-cyan-400"
              />
            </div>

            {/* Compulsory Admin Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Admin Email (Compulsory for Reset & Security) *
              </label>
              <input
                type="email"
                required
                placeholder="admin@organization.com"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Admin Secret Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-liquid-secondary w-1/3 py-3.5 px-4 rounded-2xl text-white font-semibold text-sm spring-press"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-liquid-primary w-2/3 py-3.5 px-4 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 spring-press disabled:opacity-50"
              >
                {loading ? "Deploying SaaS..." : "Deploy Organization"}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Successful Organization Setup */}
        {step === 3 && result && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/40 mx-auto flex items-center justify-center text-emerald-300 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">Gatify Deployed Successfully!</h2>
              <p className="text-xs text-slate-400">Your organization has been assigned a unique multi-tenant ID:</p>
            </div>

            <div className="p-5 rounded-2xl glass-pill text-center border border-cyan-400/40">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">ORGANIZATION ID</span>
              <span className="text-3xl font-black text-white font-mono tracking-widest">{result.organizationCode}</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Save your Organization ID <strong className="text-cyan-300 font-mono">{result.organizationCode}</strong>. Members and Gatekeepers will use this code to sign in.
            </p>

            <button
              onClick={() => router.push("/admin/dashboard")}
              className="btn-liquid-primary w-full py-4 px-6 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 spring-press"
            >
              <span>Open Admin Command Center</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
