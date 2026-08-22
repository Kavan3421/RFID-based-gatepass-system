"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Truck, ListFilter, CheckCircle2, AlertCircle, Plus, X, ArrowLeft, LogOut } from "lucide-react";

function formatPassDateLocal(isoStr) {
  if (!isoStr) return "";
  const datePart = isoStr.split("T")[0];
  if (datePart && datePart.includes("-")) {
    const [y, m, d] = datePart.split("-").map(Number);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (isoStr.includes("T00:00") || isoStr.includes("T05:30") || isoStr.includes("T18:30")) {
      return `${d} ${months[m - 1]} ${y}, 00:00`;
    }
  }
  const dt = new Date(isoStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hrs = dt.getHours().toString().padStart(2, "0");
  const mins = dt.getMinutes().toString().padStart(2, "0");
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}, ${hrs}:${mins}`;
}

export default function GatekeeperPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("HOME"); // HOME, SCAN, DELIVERY, LOGS

  // Scan QR Pass Form
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [scanMessage, setScanMessage] = useState({ type: "", code: "", text: "" });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const scanTimerRef = useRef(null);

  // Rapid Delivery Form State
  const [deliveryForm, setDeliveryForm] = useState({
    companyName: "",
    personName: "",
    phone: "",
    wing: "",
    flatNumber: "",
  });
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [deliveryMessage, setDeliveryMessage] = useState({ type: "", text: "" });
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Today's Entries List
  const [todayLogs, setTodayLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("qrgp_user");
    const token = localStorage.getItem("qrgp_token");
    if (!storedUser || !token) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "GATEKEEPER" && parsedUser.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    setUser(parsedUser);

    // Dynamically load jsQR for cross-browser live camera scanning
    if (typeof window !== "undefined" && !window.jsQR) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const triggerScanApi = async (codeToScan) => {
    if (!codeToScan) return;
    setScanMessage({ type: "", code: "", text: "" });

    try {
      const token = localStorage.getItem("qrgp_token");
      const res = await fetch("/api/gatekeeper/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ passCode: codeToScan }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        let messageText = data.message || "Invalid or Expired QR Pass.";
        if (data.statusCode === "NOT_YET_VALID" && data.validFromIso) {
          const formattedDate = formatPassDateLocal(data.validFromIso);
          messageText = `NOT YET VALID: Pass for ${data.guestName || "Guest"} is valid starting ${formattedDate}!`;
        }

        setScanMessage({
          type: "error",
          code: data.statusCode || "INVALID",
          text: messageText,
        });
        return;
      }

      setScanMessage({
        type: "success",
        code: "VERIFIED",
        text: data.message || `ENTRY APPROVED: ${data.pass.guestName} (${data.pass.destination})`,
      });
      setQrCodeInput("");
    } catch (err) {
      setScanMessage({ type: "error", code: "INVALID", text: err.message || "Invalid or Expired QR Pass." });
    }
  };

  const toggleCameraScanner = async () => {
    if (isCameraActive) {
      stopCameraStream();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setIsCameraActive(true);

        // Start continuous camera auto-scanning frame loop
        let barcodeDetector = null;
        if ("BarcodeDetector" in window) {
          try {
            barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
          } catch (e) { }
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        scanTimerRef.current = setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.paused || video.ended || video.readyState !== 4) return;

          let detectedCode = null;

          if (barcodeDetector) {
            try {
              const barcodes = await barcodeDetector.detect(video);
              if (barcodes && barcodes.length > 0) {
                detectedCode = barcodes[0].rawValue;
              }
            } catch (err) { }
          }

          if (!detectedCode && window.jsQR) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height);
            if (code && code.data) {
              detectedCode = code.data;
            }
          }

          if (detectedCode) {
            const cleanCode = detectedCode.trim().toUpperCase();
            setQrCodeInput(cleanCode);
            stopCameraStream();
            triggerScanApi(cleanCode);
          }
        }, 200);
      }
    } catch (err) {
      alert("Camera access denied or unavailable. Please check permissions or type code manually.");
      stopCameraStream();
    }
  };

  // Add Flat Destination to Delivery
  const handleAddDestination = () => {
    if (!deliveryForm.flatNumber) return;
    const destName = deliveryForm.wing
      ? `${deliveryForm.wing.trim().toUpperCase()}-${deliveryForm.flatNumber.trim()}`
      : deliveryForm.flatNumber.trim();

    if (!selectedDestinations.includes(destName)) {
      setSelectedDestinations([...selectedDestinations, destName]);
    }
    setDeliveryForm({ ...deliveryForm, wing: "", flatNumber: "" });
  };

  const handleRemoveDestination = (destToRemove) => {
    setSelectedDestinations(selectedDestinations.filter((d) => d !== destToRemove));
  };

  // Submit Delivery Entry
  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setDeliveryMessage({ type: "", text: "" });

    if (selectedDestinations.length === 0 && deliveryForm.flatNumber) {
      const destName = deliveryForm.wing
        ? `${deliveryForm.wing.trim().toUpperCase()}-${deliveryForm.flatNumber.trim()}`
        : deliveryForm.flatNumber.trim();
      selectedDestinations.push(destName);
    }

    if (selectedDestinations.length === 0) {
      setDeliveryMessage({ type: "error", text: "Please add at least one destination (Wing & Flat)." });
      return;
    }

    setSubmittingDelivery(true);

    try {
      const token = localStorage.getItem("qrgp_token");
      const res = await fetch("/api/gatekeeper/entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          entryType: "DELIVERY",
          companyName: deliveryForm.companyName,
          personName: deliveryForm.personName,
          phone: deliveryForm.phone,
          destinations: selectedDestinations,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to log delivery.");
      }

      setDeliveryMessage({ type: "success", text: "Delivery entry recorded successfully!" });
      setDeliveryForm({ companyName: "", personName: "", phone: "", wing: "", flatNumber: "" });
      setSelectedDestinations([]);
      setTimeout(() => setDeliveryMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setDeliveryMessage({ type: "error", text: err.message || "Error saving delivery entry." });
    } finally {
      setSubmittingDelivery(false);
    }
  };

  // Handle Manual QR Code Scan Submit
  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!qrCodeInput) return;
    triggerScanApi(qrCodeInput);
  };

  // Fetch Today's Logged Entries
  const fetchTodayLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTodayLogs(data.liveRegister || []);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleLogout = () => {
    stopCameraStream();
    localStorage.removeItem("qrgp_token");
    localStorage.removeItem("qrgp_user");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between glass-panel rounded-2xl p-4 border border-slate-800 bg-slate-950/80">
        <div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">GATEKEEPER PORTAL</span>
          <h1 className="text-lg font-bold text-white">{user.organizationName || user.organizationCode}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" /> Exit
        </button>
      </div>

      {/* HOME MENU: 3 Primary Action Touch Buttons */}
      {activeTab === "HOME" && (
        <div className="grid grid-cols-1 gap-4 pt-2">
          <button
            onClick={() => setActiveTab("SCAN")}
            className="w-full py-8 px-6 rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-2xl flex items-center justify-center gap-4 shadow-xl shadow-cyan-600/30 transition-all transform hover:scale-[1.01]"
          >
            <QrCode className="w-10 h-10 shrink-0" />
            Scan Guest QR Pass
          </button>

          <button
            onClick={() => setActiveTab("DELIVERY")}
            className="w-full py-8 px-6 rounded-3xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-800 hover:border-cyan-500/50 text-white font-extrabold text-2xl flex items-center justify-center gap-4 shadow-lg transition-all transform hover:scale-[1.01]"
          >
            <Truck className="w-10 h-10 text-cyan-400 shrink-0" />
            Delivery Entry
          </button>

          <button
            onClick={() => {
              setActiveTab("LOGS");
              fetchTodayLogs();
            }}
            className="w-full py-6 px-6 rounded-3xl bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-lg flex items-center justify-center gap-3 transition-colors"
          >
            <ListFilter className="w-6 h-6 text-slate-400" />
            Today's Gate Entries
          </button>
        </div>
      )}

      {/* SCAN QR SCREEN */}
      {activeTab === "SCAN" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/90 space-y-6 text-left">
          <button
            onClick={() => {
              stopCameraStream();
              setActiveTab("HOME");
            }}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Main Menu
          </button>

          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-cyan-400" /> Live Camera Auto-Scanner
          </h2>

          {scanMessage.text && (
            <div
              className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${scanMessage.code === "VERIFIED"
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                  : scanMessage.code === "NOT_YET_VALID"
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                    : scanMessage.code === "ALREADY_USED"
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : scanMessage.code === "EXPIRED"
                        ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                        : scanMessage.code === "REVOKED"
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                          : "bg-red-500/20 border-red-500/50 text-red-300"
                }`}
            >
              {scanMessage.code === "VERIFIED" ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
              <div>
                <span className="block text-xs uppercase tracking-wider opacity-80">{scanMessage.code || "SCAN RESULT"}</span>
                <span>{scanMessage.text}</span>
              </div>
            </div>
          )}

          {/* Interactive Live Camera Viewfinder */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <video ref={videoRef} className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`} autoPlay playsInline muted />

              {!isCameraActive && (
                <div className="p-6 text-center space-y-2">
                  <QrCode className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-400">Click below to open live auto-scanner camera.</p>
                </div>
              )}

              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400/50 m-6 rounded-2xl flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-cyan-400 rounded-xl animate-pulse" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleCameraScanner}
              className={`px-5 py-3 rounded-2xl font-extrabold text-xs inline-flex items-center gap-2 shadow-lg transition-all ${isCameraActive
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30"
                }`}
            >
              <QrCode className="w-4 h-4" /> {isCameraActive ? "Stop Camera Scanner" : "Start Live Auto-Camera Scanner"}
            </button>
          </div>

          <form onSubmit={handleScanSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Manual QR Pass Code Input</label>
              <input
                type="text"
                required
                placeholder="Scan QR or type token (e.g. QGP-8A9F21B3)"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value.toUpperCase())}
                className="w-full px-4 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white font-mono text-lg tracking-wider placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg shadow-lg shadow-cyan-600/30 transition-all"
            >
              Validate & Allow Entry
            </button>
          </form>
        </div>
      )}

      {/* RAPID DELIVERY ENTRY SCREEN */}
      {activeTab === "DELIVERY" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/90 space-y-6 text-left">
          <button
            onClick={() => setActiveTab("HOME")}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Main Menu
          </button>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-cyan-400" /> Rapid Delivery Entry
            </h2>
          </div>

          {deliveryMessage.text && (
            <div
              className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${deliveryMessage.type === "success"
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                  : "bg-red-500/20 border-red-500/50 text-red-300"
                }`}
            >
              {deliveryMessage.type === "success" ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
              <span>{deliveryMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleDeliverySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Amazon, Zomato, Swiggy..."
                  value={deliveryForm.companyName}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, companyName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Delivery agent name"
                  value={deliveryForm.personName}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, personName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Mobile Number (Optional)</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={deliveryForm.phone}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Add Destination(s)</label>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="text"
                    placeholder="Wing (A/B)"
                    value={deliveryForm.wing}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, wing: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 uppercase"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Flat / Unit #"
                    value={deliveryForm.flatNumber}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, flatNumber: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDestination}
                  className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {selectedDestinations.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] text-slate-400 font-medium">Selected ({selectedDestinations.length}):</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedDestinations.map((dest, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold"
                      >
                        {dest}
                        <button
                          type="button"
                          onClick={() => handleRemoveDestination(dest)}
                          className="hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingDelivery}
              className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-lg shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
            >
              {submittingDelivery ? "Logging Delivery..." : "Record Delivery Entry"}
            </button>
          </form>
        </div>
      )}

      {/* TODAY'S LOGS SCREEN */}
      {activeTab === "LOGS" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/90 space-y-4 text-left">
          <button
            onClick={() => setActiveTab("HOME")}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Main Menu
          </button>

          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ListFilter className="w-6 h-6 text-cyan-400" /> Today's Gate Entries
          </h2>

          {loadingLogs ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading gate entries...</div>
          ) : todayLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No entries recorded today yet.</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {todayLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${log.entry_type === 'DELIVERY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                        {log.entry_type}
                      </span>
                      <strong className="text-white text-sm">{log.person_name}</strong>
                      {log.company_name && <span className="text-slate-400">({log.company_name})</span>}
                    </div>
                    <p className="text-slate-400 mt-1">
                      Destinations: <strong className="text-slate-200">{Array.isArray(log.destinations) ? log.destinations.join(", ") : log.destinations}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block">{new Date(log.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`inline-block mt-1 font-semibold ${log.status === 'INSIDE' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
