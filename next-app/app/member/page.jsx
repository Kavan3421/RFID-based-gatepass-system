"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { QrCode, Plus, History, CheckCircle2, AlertCircle, Clock, LogOut, Copy, User, Download, Calendar } from "lucide-react";

// Format date to local string (e.g. "21 Aug 2026, 00:00")
function formatLocalPassDate(isoString) {
  if (!isoString) return "";
  const dt = new Date(isoString);
  if (isoString.includes("T00:00:00")) {
    const [datePart] = isoString.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    const localDt = new Date(y, m - 1, d, 0, 0, 0);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d} ${months[m - 1]} ${y}, 00:00`;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = dt.getDate();
  const mStr = months[dt.getMonth()];
  const y = dt.getFullYear();
  const hrs = dt.getHours().toString().padLeft(2, "0");
  const mins = dt.getMinutes().toString().padLeft(2, "0");
  return `${d} ${mStr} ${y}, ${hrs}:${mins}`;
}

export default function MemberPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("CREATE"); // CREATE, HISTORY
  const [passes, setPasses] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);

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
    const storedUser = localStorage.getItem("qrgp_user");
    const token = localStorage.getItem("qrgp_token");
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
      const token = localStorage.getItem("qrgp_token");
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
      const token = localStorage.getItem("qrgp_token");
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
      const token = localStorage.getItem("qrgp_token");

      // Construct Local Start of Day Date object
      const [year, month, day] = form.validDate.split("-").map(Number);
      const localValidFrom = new Date(year, month - 1, day, 0, 0, 0);

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
          dark: "#0F172A",
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
      color: { dark: "#0F172A", light: "#FFFFFF" },
    });

    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 650;
    const ctx = canvas.getContext("2d");

    // Background Card
    const grad = ctx.createLinearGradient(0, 0, 500, 650);
    grad.addColorStop(0, "#0F172A");
    grad.addColorStop(1, "#1E293B");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 500, 650);

    ctx.strokeStyle = "#06B6D4";
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 476, 626);

    ctx.fillStyle = "#06B6D4";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("SURVEILEYE DIGITAL GATE PASS", 130, 55);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "extrabold 24px sans-serif";
    ctx.fillText("VISITOR ACCESS PASS", 115, 95);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Guest Name: ${pass.guest_name}`, 50, 140);
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
      ctx.fillText(pass.pass_code, 120, 520);

      ctx.fillStyle = "#94A3B8";
      ctx.font = "12px sans-serif";
      ctx.fillText("Present this QR Code to Gatekeeper or Scanner for Instant Entry", 60, 560);

      const link = document.createElement("a");
      link.download = `QR-Pass-${pass.pass_code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  };

  const handleLogout = () => {
    localStorage.removeItem("qrgp_token");
    localStorage.removeItem("qrgp_user");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-left">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">MEMBER PORTAL</span>
          <h1 className="text-xl font-bold text-white">Welcome, {user.username}</h1>
          <p className="text-xs text-slate-400">Organization Code: <strong className="text-slate-200 font-mono">{user.organizationCode}</strong></p>
        </div>
        <button
          onClick={handleLogout}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("CREATE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "CREATE" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Generate Guest Pass
        </button>
        <button
          onClick={() => {
            setActiveTab("HISTORY");
            fetchMyPasses();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "HISTORY" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Guest History ({passes.length})
        </button>
      </div>

      {/* GENERATE GUEST PASS TAB */}
      {activeTab === "CREATE" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/90 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-400" /> Create Digital Visitor Pass
          </h2>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Generated Pass Result Banner with REAL QR Image */}
          {createdPass && (
            <div className="p-6 rounded-3xl bg-slate-900 border-2 border-cyan-500/50 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 mx-auto flex items-center justify-center text-cyan-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Guest Pass Generated!</h3>
              <p className="text-xs text-slate-300">Present this QR Code at the gate for instant entry verification:</p>
              
              {/* REAL SCANNABLE QR CODE IMAGE ON SCREEN */}
              {qrDataUrl && (
                <div className="py-2">
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${createdPass.pass_code}`}
                    className="w-64 h-64 mx-auto rounded-2xl border-4 border-cyan-500 bg-white p-3 shadow-2xl"
                  />
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-2xl font-extrabold text-cyan-400 font-mono tracking-wider inline-block">
                {createdPass.pass_code}
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>Guest Name: <strong className="text-white text-sm">{createdPass.guest_name}</strong></p>
                <p>Valid Until: <strong className="text-cyan-300">{formatLocalPassDate(createdPass.valid_until)}</strong></p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadPassObj(createdPass)}
                  className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-sm flex items-center gap-2 transition-all shadow-xl shadow-cyan-600/30"
                >
                  <Download className="w-4 h-4" /> Download Real QR Pass Image
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleCreatePass} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Guest Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Guest Mobile Number (Optional)</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={form.guestPhone}
                onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Destination (Flat / Dept) *</label>
                <select
                  required
                  value={form.destinationId}
                  onChange={(e) => setForm({ ...form, destinationId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select Destination...</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Valid Date *</label>
                <input
                  type="date"
                  required
                  value={form.validDate}
                  onChange={(e) => setForm({ ...form, validDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Validity Duration *</label>
                <select
                  value={form.durationHours}
                  onChange={(e) => setForm({ ...form, durationHours: parseInt(e.target.value, 10) })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value={4}>4 Hours</option>
                  <option value={8}>8 Hours</option>
                  <option value={12}>12 Hours (Default)</option>
                  <option value={24}>24 Hours (Full Day)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-base shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Guest QR Pass"}
            </button>
          </form>
        </div>
      )}

      {/* GUEST HISTORY TAB */}
      {activeTab === "HISTORY" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/90 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" /> My Guest Pass History
          </h2>

          <div className="space-y-3">
            {passes.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">No guest passes generated yet.</div>
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
                  <div key={pass.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white text-sm block">{pass.guest_name}</strong>
                      <span className="text-slate-400 font-mono text-[11px] block mt-0.5">Code: {pass.pass_code}</span>
                      <span className="text-slate-500 text-[10px]">Valid Until: {formatLocalPassDate(pass.valid_until)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        computedStatus === 'ACTIVE' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                        computedStatus === 'NOT YET VALID' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        computedStatus === 'USED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {computedStatus}
                      </span>

                      {/* SHOW DOWNLOAD BUTTON FOR ACTIVE & NOT YET VALID PASSES */}
                      {canDownload && (
                        <button
                          onClick={() => handleDownloadPassObj(pass)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md"
                        >
                          <Download className="w-3.5 h-3.5" /> Download QR
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
