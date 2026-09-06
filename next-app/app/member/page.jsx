"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { QrCode, Plus, History, CheckCircle2, AlertCircle, Clock, LogOut, Copy, User, Download, Calendar, Sparkles, Sun, Moon } from "lucide-react";

// Format date to local string (e.g. "21 Aug 2026, 00:00")
function formatLocalPassDate(isoString) {
  if (!isoString) return "";
  const dt = new Date(isoString);
  if (isoString.includes("T00:00:00")) {
    const [datePart] = isoString.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d} ${months[m - 1]} ${y}, 00:00`;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = dt.getDate();
  const mStr = months[dt.getMonth()];
  const y = dt.getFullYear();
  const hrs = dt.getHours().toString().padStart(2, "0");
  const mins = dt.getMinutes().toString().padStart(2, "0");
  return `${d} ${mStr} ${y}, ${hrs}:${mins}`;
}

export default function MemberPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("CREATE"); // CREATE, HISTORY
  const [passes, setPasses] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Theme State
  const [theme, setTheme] = useState("dark");

  // Guest Pass Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    guestName: "",
    guestPhone: "",
    destinationId: "",
    validDate: todayStr,
    durationHours: 12,
  });
  const [createdPass, setCreatedPass] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("gatify_theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.classList.toggle("light", savedTheme === "light");

    const storedUser = localStorage.getItem("gatify_user") || localStorage.getItem("qrgp_user");
    const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
    if (!storedUser || !token) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "MEMBER" && parsedUser.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    setUser(parsedUser);
    fetchDestinations();
    fetchMyPasses();
  }, []);

  const fetchDestinations = async () => {
    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/destinations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDestinations(data.destinations || []);
    } catch (err) {
      console.error("Fetch destinations error:", err);
    }
  };

  const fetchMyPasses = async () => {
    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/member/guest-pass", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPasses(data.passes || []);
    } catch (err) {
      console.error("Fetch passes error:", err);
    }
  };

  const handleCreatePass = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setCreatedPass(null);
    setQrDataUrl("");

    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");

      // Construct Local Start of Day Date object (or now if today)
      const [year, month, day] = form.validDate.split("-").map(Number);
      const isSelectedToday = form.validDate === todayStr;
      const localValidFrom = isSelectedToday ? new Date() : new Date(year, month - 1, day, 0, 0, 0);

      const res = await fetch("/api/member/guest-pass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          validFromIso: localValidFrom.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to generate guest pass.");
      }

      const pass = data.pass;
      setCreatedPass(pass);

      // Generate REAL scannable QR Code Data URL
      const qrUrl = await QRCode.toDataURL(pass.pass_code, {
        width: 320,
        margin: 2,
        color: {
          dark: "#070B14",
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(qrUrl);

      setForm({ guestName: "", guestPhone: "", destinationId: "", validDate: todayStr, durationHours: 12 });
      fetchMyPasses();
    } catch (err) {
      setError(err.message || "Error generating pass.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPassObj = async (pass) => {
    const qrUrl = await QRCode.toDataURL(pass.pass_code, {
      width: 320,
      margin: 2,
      color: { dark: "#070B14", light: "#FFFFFF" },
    });

    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 650;
    const ctx = canvas.getContext("2d");

    // Background Card
    const grad = ctx.createLinearGradient(0, 0, 500, 650);
    grad.addColorStop(0, "#050811");
    grad.addColorStop(1, "#0F172A");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 500, 650);

    // Cyan Specular Border
    ctx.strokeStyle = "#06B6D4";
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, 472, 622);

    // Gatify Header Branding
    ctx.fillStyle = "#06B6D4";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("GATIFY DIGITAL GATE PASS", 135, 55);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "extrabold 22px sans-serif";
    ctx.fillText("VISITOR ACCESS CREDENTIAL", 85, 95);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Guest: ${pass.guest_name}`, 50, 140);
    ctx.fillText(`Valid Until: ${formatLocalPassDate(pass.valid_until)}`, 50, 168);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = qrUrl;

    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(110, 195, 280, 280);
      ctx.drawImage(img, 120, 205, 260, 260);

      ctx.fillStyle = "#06B6D4";
      ctx.font = "bold 22px monospace";
      ctx.fillText(pass.pass_code, 130, 520);

      ctx.fillStyle = "#94A3B8";
      ctx.font = "12px sans-serif";
      ctx.fillText("Present this QR Code to Gatify Scanner for Instant Entry", 75, 560);

      const link = document.createElement("a");
      link.download = `Gatify-Pass-${pass.pass_code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  };

  const handleCopyPassCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("gatify_token");
    localStorage.removeItem("gatify_user");
    localStorage.removeItem("qrgp_token");
    localStorage.removeItem("qrgp_user");
    router.push("/login");
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("gatify_theme", next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="ui-kicker">Member portal · {user.organizationCode}</p>
          <h1 className="text-2xl font-bold mt-1">Welcome, {user.username}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm font-medium flex items-center gap-1.5 hover:text-rose-400"
        >
          <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>

      <div className="ui-tab-bar">
        <button
          onClick={() => setActiveTab("CREATE")}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-sm font-semibold ${
            activeTab === "CREATE" ? "btn-liquid-primary" : "text-[var(--text-secondary)]"
          }`}
        >
          New guest pass
        </button>
        <button
          onClick={() => {
            setActiveTab("HISTORY");
            fetchMyPasses();
          }}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-sm font-semibold ${
            activeTab === "HISTORY" ? "btn-liquid-primary" : "text-[var(--text-secondary)]"
          }`}
        >
          History ({passes.length})
        </button>
      </div>

      {/* GENERATE GUEST PASS TAB */}
      {activeTab === "CREATE" && (
        <div className="glass-elevated rounded-2xl p-5 sm:p-7 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-400" />
            <span>Create visitor pass</span>
          </h2>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Generated Reflective Credential Badge */}
          {createdPass && (
            <div className="glass-qr-badge rounded-3xl p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 mx-auto flex items-center justify-center text-cyan-300 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Guest Pass Active!</h3>
                <p className="text-xs text-slate-300 mt-1">Present this QR Code credential at the security gate for automated verification:</p>
              </div>
              
              {/* REAL SCANNABLE QR CODE IMAGE */}
              {qrDataUrl && (
                <div className="py-2">
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${createdPass.pass_code}`}
                    className="w-60 h-60 mx-auto rounded-3xl border-4 border-cyan-400/80 bg-white p-3 shadow-2xl shadow-cyan-500/20"
                  />
                </div>
              )}

              <div className="p-4 rounded-2xl glass-pill inline-flex items-center gap-3">
                <span className="text-2xl font-black text-cyan-300 font-mono tracking-widest">{createdPass.pass_code}</span>
                <button
                  type="button"
                  onClick={() => handleCopyPassCode(createdPass.pass_code)}
                  className="p-2 rounded-xl hover:bg-white/10 text-cyan-400 spring-press transition-colors"
                  title="Copy Token"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {copiedToken && (
                <span className="block text-xs font-bold text-emerald-400 animate-pulse">Token copied to clipboard!</span>
              )}

              <div className="text-xs text-slate-400 space-y-1">
                <p>Guest Name: <strong className="text-white text-sm">{createdPass.guest_name}</strong></p>
                <p>Valid Until: <strong className="text-cyan-300">{formatLocalPassDate(createdPass.valid_until)}</strong></p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadPassObj(createdPass)}
                  className="btn-liquid-primary px-6 py-3.5 rounded-2xl text-white font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-cyan-600/30 spring-press"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Gatify QR Pass Card</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleCreatePass} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Guest Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Guest Mobile Number (Optional)</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={form.guestPhone}
                onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Destination (Flat / Unit) *</label>
                <select
                  required
                  value={form.destinationId}
                  onChange={(e) => setForm({ ...form, destinationId: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm focus:border-cyan-400"
                >
                  <option value="" className="bg-slate-900 text-white">Select Destination...</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">{d.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Valid Date *</label>
                <input
                  type="date"
                  required
                  value={form.validDate}
                  onChange={(e) => setForm({ ...form, validDate: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Validity Duration *</label>
                <select
                  value={form.durationHours}
                  onChange={(e) => setForm({ ...form, durationHours: parseInt(e.target.value, 10) })}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm focus:border-cyan-400"
                >
                  <option value={4} className="bg-slate-900 text-white">4 Hours</option>
                  <option value={8} className="bg-slate-900 text-white">8 Hours</option>
                  <option value={12} className="bg-slate-900 text-white">12 Hours (Default)</option>
                  <option value={24} className="bg-slate-900 text-white">24 Hours (Full Day)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-liquid-primary w-full py-4 rounded-2xl text-white font-extrabold text-base shadow-xl shadow-cyan-600/30 spring-press disabled:opacity-50 mt-2"
            >
              {loading ? "Generating Credential..." : "Generate Guest QR Pass"}
            </button>
          </form>
        </div>
      )}

      {/* GUEST HISTORY TAB */}
      {activeTab === "HISTORY" && (
        <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>My Guest Pass History</span>
          </h2>

          <div className="space-y-3 pt-2">
            {passes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No guest passes generated yet.</div>
            ) : (
              passes.map((pass) => {
                const now = new Date();
                const validFrom = pass.valid_from ? new Date(pass.valid_from) : new Date(0);
                const validUntil = pass.valid_until ? new Date(pass.valid_until) : new Date(0);

                const isFuture = now < validFrom;
                const isExpired = now > validUntil;

                let computedStatus = pass.status;
                if (pass.status !== "USED" && pass.status !== "REVOKED") {
                  if (isFuture) {
                    computedStatus = "NOT YET VALID";
                  } else if (isExpired) {
                    computedStatus = "EXPIRED";
                  } else {
                    computedStatus = "ACTIVE";
                  }
                }

                const canDownload = computedStatus === "ACTIVE" || computedStatus === "NOT YET VALID";

                return (
                  <div key={pass.id} className="glass-plank p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <strong className="text-white text-sm font-bold block">{pass.guest_name}</strong>
                      <span className="text-slate-400 font-mono text-[11px] block mt-0.5">Code: {pass.pass_code}</span>
                      <span className="text-slate-500 text-[10px]">Valid Until: {formatLocalPassDate(pass.valid_until)}</span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] ${
                        computedStatus === 'ACTIVE' ? 'glass-badge-cyan' :
                        computedStatus === 'NOT YET VALID' ? 'glass-badge-amber' :
                        computedStatus === 'USED' ? 'glass-badge-emerald' :
                        'glass-badge-ruby'
                      }`}>
                        {computedStatus}
                      </span>

                      {canDownload && (
                        <button
                          onClick={() => handleDownloadPassObj(pass)}
                          className="btn-liquid-secondary px-3 py-1.5 rounded-xl text-white font-bold text-[11px] flex items-center gap-1.5 spring-press"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-400" /> Download
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
