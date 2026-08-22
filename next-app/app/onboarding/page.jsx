"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Layers, User, Lock, CheckCircle2, ArrowRight, ShieldCheck, Mail } from "lucide-react";

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
      <div className="w-full max-w-xl glass-panel rounded-3xl p-8 border border-slate-800 bg-slate-950/90 shadow-2xl space-y-6">
        {/* Wizard Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mx-auto flex items-center justify-center text-cyan-400">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Setup Your Organization</h1>
          <p className="text-xs text-slate-400">Deploy QR Gate Pass for your residential or commercial community.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800'}`}>1. Details</span>
          <span>→</span>
          <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800'}`}>2. Admin Account</span>
          <span>→</span>
          <span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800'}`}>3. Confirmation</span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* STEP 1: Organization & Destination Structure */}
        {step === 1 && (
          <div className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Organization / Society Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Green Valley Society"
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Organization Type</label>
                <select
                  value={form.organizationType}
                  onChange={(e) => setForm({ ...form, organizationType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="society">Residential Society</option>
                  <option value="apartment">Apartment Complex</option>
                  <option value="villa">Bungalow / Villa Community</option>
                  <option value="office">Corporate Office</option>
                  <option value="commercial">Commercial Building</option>
                  <option value="warehouse">Warehouse / Factory</option>
                  <option value="school">School / College</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Destination Structure</label>
                <select
                  value={form.destinationType}
                  onChange={(e) => setForm({ ...form, destinationType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="flat_wing">Wing + Flat Number (e.g. A-203)</option>
                  <option value="house_plot">House / Plot Number (e.g. 104)</option>
                  <option value="villa">Villa Number (e.g. Villa 12)</option>
                  <option value="department">Department (e.g. HR, IT)</option>
                  <option value="custom">Custom Destination Labels</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.organizationName) return setError("Organization Name is required.");
                setError("");
                setStep(2);
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all"
            >
              Continue to Admin Account
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Admin Account Credentials */}
        {step === 2 && (
          <form onSubmit={handleCreateOrg} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Admin Username</label>
              <input
                type="text"
                required
                placeholder="e.g. admin_greenvalley"
                value={form.adminUsername}
                onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Compulsory Admin Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                Admin Email (Compulsory for Reset & Notifications) *
              </label>
              <input
                type="email"
                required
                placeholder="admin@organization.com"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-cyan-500/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Admin Secret Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
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
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">System Deployed Successfully!</h2>
              <p className="text-xs text-slate-400">Your organization has been assigned a unique multi-tenant ID:</p>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center">
              <span className="text-xs text-cyan-400 font-semibold block">ORGANIZATION ID</span>
              <span className="text-3xl font-extrabold text-cyan-300 font-mono tracking-widest">{result.organizationCode}</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Save your Organization ID <strong>{result.organizationCode}</strong>. Members and Gatekeepers will use this code to sign in.
            </p>

            <button
              onClick={() => router.push("/admin/dashboard")}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 transition-all"
            >
              Open Admin Command Center
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
