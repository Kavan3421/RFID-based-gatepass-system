"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Truck, ListFilter, CheckCircle2, AlertCircle, Plus, X, ArrowLeft, LogOut, Camera, ShieldCheck, LogIn, DoorOpen, Sun, Moon } from "lucide-react";

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

  // Scan Mode: ENTRY or EXIT
  const [scanMode, setScanMode] = useState("ENTRY");
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

  // Theme State
  const [theme, setTheme] = useState("dark");

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

  const triggerScanApi = async (codeToScan, overrideMode) => {
    if (!codeToScan) return;
    const mode = overrideMode || scanMode;
    setScanMessage({ type: "", code: "", text: "" });

    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/gatekeeper/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          passCode: codeToScan,
          scanType: mode,
        }),
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
        code: data.statusCode || (mode === "EXIT" ? "EXIT_RECORDED" : "VERIFIED"),
        text: data.message || (mode === "EXIT" ? `EXIT RECORDED: ${data.pass?.guestName} Checked Out` : `ENTRY APPROVED: ${data.pass?.guestName} (${data.pass?.destination})`),
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

        let barcodeDetector = null;
        if ("BarcodeDetector" in window) {
          try {
            barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
          } catch (e) {}
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
            } catch (err) {}
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
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
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
        setDeliveryMessage({ type: "error", text: data.message || "Failed to log delivery." });
        return;
      }

      setDeliveryMessage({ type: "success", text: "Delivery entry recorded successfully!" });
      setDeliveryForm({ companyName: "", personName: "", phone: "", wing: "", flatNumber: "" });
      setSelectedDestinations([]);
    } catch (err) {
      setDeliveryMessage({ type: "error", text: err.message || "Network error. Please retry." });
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    triggerScanApi(qrCodeInput);
  };

  const fetchTodayLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTodayLogs(data.liveRegister || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleLogout = () => {
    stopCameraStream();
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
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="ui-kicker">Gatekeeper</p>
            <h1 className="text-lg font-bold truncate">{user.organizationName || user.organizationCode}</h1>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2.5 rounded-xl border border-[var(--border)] hover:text-rose-400"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* HOME MENU: 3 Elevated Rectangular Glass Action Cards */}
      {activeTab === "HOME" && (
        <div className="space-y-5 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Scan Entry Pass */}
            <button
              onClick={() => {
                setScanMode("ENTRY");
                setActiveTab("SCAN");
              }}
              className="glass-elevated liquid-glass-surface rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center group liquid-touch-spring transition-all border-t border-l border-white/20 hover:border-cyan-400/40 cursor-pointer shadow-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-5 group-hover:scale-105 transition-transform shadow-[0_0_24px_rgba(6,182,212,0.25)]">
                <LogIn className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-xl font-semibold text-white tracking-tight">Scan Entry Pass</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">IN</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mt-1">Validate guest pass & permit campus entry</p>
            </button>

            {/* Card 2: Scan Exit Pass */}
            <button
              onClick={() => {
                setScanMode("EXIT");
                setActiveTab("SCAN");
              }}
              className="glass-elevated liquid-glass-surface rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center group liquid-touch-spring transition-all border-t border-l border-white/20 hover:border-amber-400/40 cursor-pointer shadow-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-5 group-hover:scale-105 transition-transform shadow-[0_0_24px_rgba(245,158,11,0.25)]">
                <DoorOpen className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-xl font-semibold text-white tracking-tight">Scan Exit Pass</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">OUT</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mt-1">Log visitor exit & checkout status</p>
            </button>

            {/* Card 3: Add Delivery Entry */}
            <button
              onClick={() => setActiveTab("DELIVERY")}
              className="glass-elevated liquid-glass-surface rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center group liquid-touch-spring transition-all border-t border-l border-white/20 hover:border-indigo-400/40 cursor-pointer shadow-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-300 mb-5 group-hover:scale-105 transition-transform shadow-[0_0_24px_rgba(99,102,241,0.25)]">
                <Truck className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-xl font-semibold text-white tracking-tight">Add Delivery Entry</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">COURIER</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mt-1">Fast multi-destination delivery logging</p>
            </button>
          </div>

          {/* Secondary Action: Today's Gate Entries */}
          <button
            onClick={() => {
              setActiveTab("LOGS");
              fetchTodayLogs();
            }}
            className="glass-plank liquid-glass-surface liquid-touch-spring w-full py-4 px-6 rounded-2xl text-white/80 hover:text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-colors border-t border-white/15"
          >
            <ListFilter className="w-4 h-4 text-cyan-400" />
            <span>View Today's Gate Entries</span>
          </button>
        </div>
      )}

      {/* SCAN QR SCREEN */}
      {activeTab === "SCAN" && (
        <div className="glass-floating rounded-3xl p-6 space-y-6 text-left animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                stopCameraStream();
                setActiveTab("HOME");
              }}
              className="btn-liquid-secondary text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-md"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" /> Back to Main Menu
            </button>

            {/* Mode Switcher Pills */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/10">
              <button
                type="button"
                onClick={() => setScanMode("ENTRY")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  scanMode === "ENTRY"
                    ? "bg-white/10 text-white font-semibold border border-white/20 shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Scan Entry
              </button>
              <button
                type="button"
                onClick={() => setScanMode("EXIT")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  scanMode === "EXIT"
                    ? "bg-white/10 text-white font-semibold border border-white/20 shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Scan Exit
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
              <QrCode className={`w-6 h-6 ${scanMode === "ENTRY" ? "text-cyan-400" : "text-amber-400"}`} />
              <span>{scanMode === "ENTRY" ? "Guest Entry Scanner" : "Guest Exit / Checkout Scanner"}</span>
            </h2>
          </div>

          {/* Mode Banner Indicator */}
          <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            scanMode === "ENTRY"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}>
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-ping ${scanMode === "ENTRY" ? "bg-cyan-400" : "bg-amber-400"}`} />
              {scanMode === "ENTRY" ? "MODE: SCANNING VISITOR ENTRY" : "MODE: SCANNING VISITOR EXIT & CHECKOUT"}
            </span>
            <span className="text-[10px] uppercase opacity-75">Tap toggle to switch</span>
          </div>

          {scanMessage.text && (
            <div
              className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 animate-in fade-in duration-200 ${
                scanMessage.code === "VERIFIED" || scanMessage.code === "EXIT_RECORDED"
                  ? "glass-badge-emerald"
                  : scanMessage.code === "NOT_YET_VALID"
                  ? "glass-badge-cyan"
                  : scanMessage.code === "ALREADY_USED" || scanMessage.code === "ALREADY_EXITED" || scanMessage.code === "ALREADY_INSIDE"
                  ? "glass-badge-amber"
                  : "glass-badge-ruby"
              }`}
            >
              {scanMessage.code === "VERIFIED" || scanMessage.code === "EXIT_RECORDED" ? (
                <CheckCircle2 className="w-6 h-6 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 shrink-0" />
              )}
              <div>
                <span className="block text-[10px] uppercase tracking-wider opacity-80">{scanMessage.code || "SCAN RESULT"}</span>
                <span className="text-sm">{scanMessage.text}</span>
              </div>
            </div>
          )}

          {/* Interactive Live Camera Viewfinder HUD */}
          <div className="p-4 rounded-3xl glass-sheet text-center space-y-3">
            <div className="relative aspect-video rounded-2xl bg-slate-950/90 border border-white/10 overflow-hidden flex items-center justify-center">
              <video ref={videoRef} className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`} autoPlay playsInline muted />

              {!isCameraActive && (
                <div className="p-6 text-center space-y-2">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${
                    scanMode === "ENTRY" ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-400" : "bg-amber-500/10 border-amber-400/30 text-amber-400"
                  }`}>
                    <Camera className="w-7 h-7 animate-pulse" />
                  </div>
                  <p className="text-xs text-white/70 font-medium">Ready for {scanMode === "ENTRY" ? "Entry" : "Exit"} camera auto-scanning.</p>
                </div>
              )}

              {isCameraActive && (
                <div className={`absolute inset-0 pointer-events-none border-2 m-6 rounded-2xl flex items-center justify-center ${
                  scanMode === "ENTRY" ? "border-cyan-400/50" : "border-amber-400/50"
                }`}>
                  <div className={`w-48 h-48 border-2 border-dashed rounded-2xl animate-pulse shadow-lg ${
                    scanMode === "ENTRY" ? "border-cyan-400 shadow-cyan-400/30" : "border-amber-400 shadow-amber-400/30"
                  }`} />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleCameraScanner}
              className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xl spring-press ${
                isCameraActive
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/35 border-t border-white/40"
                  : "btn-liquid-primary"
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>{isCameraActive ? "Stop Camera Scanner" : `Start Live ${scanMode === "ENTRY" ? "Entry" : "Exit"} Scanner`}</span>
            </button>
          </div>

          <form onSubmit={handleScanSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Manual Pass Code Input</label>
              <input
                type="text"
                required
                placeholder="Scan QR or type token (e.g. QGP-8A9F21B3)"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value.toUpperCase())}
                className="glass-input w-full px-4 py-3.5 rounded-2xl text-white font-mono text-base font-semibold tracking-wider placeholder:text-white/40"
              />
            </div>

            <button
              type="submit"
              className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-semibold text-base spring-press"
            >
              {scanMode === "ENTRY" ? "Validate & Permit Entry" : "Validate & Record Exit"}
            </button>
          </form>
        </div>
      )}

      {/* RAPID DELIVERY ENTRY SCREEN */}
      {activeTab === "DELIVERY" && (
        <div className="glass-floating rounded-3xl p-6 space-y-6 text-left animate-in fade-in duration-200">
          <button
            onClick={() => setActiveTab("HOME")}
            className="text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1.5 spring-press"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" /> Back to Main Menu
          </button>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
              <Truck className="w-6 h-6 text-cyan-400" />
              <span>Rapid Delivery Entry</span>
            </h2>
          </div>

          {deliveryMessage.text && (
            <div
              className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 animate-in fade-in duration-200 ${
                deliveryMessage.type === "success"
                  ? "glass-badge-emerald"
                  : "glass-badge-ruby"
              }`}
            >
              {deliveryMessage.type === "success" ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
              <span>{deliveryMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleDeliverySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Amazon, Zomato, Swiggy, Flipkart..."
                  value={deliveryForm.companyName}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, companyName: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Agent Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Delivery agent name"
                  value={deliveryForm.personName}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, personName: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Mobile Number (Optional)</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={deliveryForm.phone}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, phone: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm"
              />
            </div>

            {/* Destination Builder Box with Interactive Frosted Chips */}
            <div className="p-4 rounded-2xl glass-sheet space-y-3">
              <label className="text-xs font-semibold text-cyan-300 uppercase tracking-wider block">Add Destination Flat(s) *</label>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="text"
                    placeholder="Wing (A/B)"
                    value={deliveryForm.wing}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, wing: e.target.value.toUpperCase() })}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white text-sm uppercase"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Flat # (101)"
                    value={deliveryForm.flatNumber}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, flatNumber: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDestination}
                  className="btn-liquid-secondary py-2.5 px-3 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1 spring-press"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {selectedDestinations.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] text-white/60 font-medium">Selected Destinations ({selectedDestinations.length}):</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedDestinations.map((dest, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-badge-cyan text-xs font-semibold animate-in fade-in duration-150"
                      >
                        {dest}
                        <button
                          type="button"
                          onClick={() => handleRemoveDestination(dest)}
                          className="hover:text-rose-400 transition-colors"
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
              className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 spring-press disabled:opacity-50"
            >
              {submittingDelivery ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Record Delivery Entry"}
            </button>
          </form>
        </div>
      )}

      {/* TODAY'S ACTIVITY LOGS */}
      {activeTab === "LOGS" && (
        <div className="glass-floating rounded-3xl p-6 space-y-6 text-left animate-in fade-in duration-200">
          <button
            onClick={() => setActiveTab("HOME")}
            className="text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1.5 spring-press"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" /> Back to Main Menu
          </button>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
              <ListFilter className="w-6 h-6 text-cyan-400" />
              <span>Today's Movements Log</span>
            </h2>
            <button
              onClick={fetchTodayLogs}
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="divide-y divide-white/5 rounded-2xl border border-white/5 overflow-hidden">
            {loadingLogs ? (
              <div className="py-12 text-center text-white/60 text-sm">Loading today's logs...</div>
            ) : todayLogs.length === 0 ? (
              <div className="py-12 text-center text-white/60 text-sm">No gate entry movements logged yet today.</div>
            ) : (
              todayLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between text-xs hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full font-medium text-[11px] shrink-0 ${log.entry_type === "DELIVERY" ? "glass-badge-amber" : "glass-badge-cyan"}`}>
                      {log.entry_type}
                    </span>
                    <div>
                      <strong className="text-white text-sm font-semibold block">{log.person_name}</strong>
                      <p className="text-white/60 text-xs mt-0.5">
                        Dest: <strong className="text-cyan-300 font-mono font-medium">{Array.isArray(log.destinations) ? log.destinations.join(", ") : log.destinations}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white/60 text-xs">
                      {new Date(log.entry_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${log.status === "INSIDE" ? "glass-badge-emerald" : "glass-badge-indigo"}`}>
                      {log.status === "INSIDE" ? "ENTERED" : "EXITED"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
