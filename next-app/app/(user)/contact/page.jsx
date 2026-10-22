"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Mail, User, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function UserContactPage() {
  const router = useRouter();
  const { currentUser, token } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        message: "",
      });
    } else {
      router.push("/auth");
    }
  }, [currentUser, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit message");
      }

      setSuccess("Your feedback message has been sent to system administrators!");
      setFormData((prev) => ({ ...prev, message: "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Contact & Support</h1>
        <p className="text-white/70 text-xs sm:text-sm">
          Have an issue with your RFID tag or vehicle entry? Send a direct message to system admins.
        </p>
      </div>

      <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/70 mb-1.5">Your Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/70 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/70 mb-1.5">Message / Inquiry</label>
            <textarea
              name="message"
              required
              rows={4}
              placeholder="Describe your issue or request here..."
              value={formData.message}
              onChange={handleChange}
              className="glass-input w-full p-3.5 rounded-xl text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-liquid-primary liquid-touch-spring w-full py-3.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
