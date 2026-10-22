"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TimePicker from "@/components/ui/TimePicker";
import {
  QrCode,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Printer,
} from "lucide-react";

export default function UserGatepassPage() {
  const router = useRouter();
  const { currentUser, token } = useSelector((state) => state.user);

  const [reason, setReason] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [qrDataStr, setQrDataStr] = useState("");

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth");
    }
  }, [currentUser, router]);

  // Submit visitor gatepass details and request QR code generation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !time) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setQrCodeImage(null);

    try {
      // 1. Submit Gatepass reason log to backend API
      const gatepassRes = await fetch("/api/user/gatepass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, time }),
      });

      const gatepassData = await gatepassRes.json();
      if (!gatepassRes.ok) {
        throw new Error(gatepassData.message || "Failed to register gatepass request");
      }

      // 2. Generate QR Code Pass
      const qrRes = await fetch("/api/user/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, time }),
      });

      const qrData = await qrRes.json();
      if (!qrRes.ok) {
        throw new Error(qrData.message || "Failed to generate QR code");
      }

      setSuccessMsg("Gate pass request registered & QR Pass generated successfully!");
      setQrCodeImage(qrData.qrImage);
      setQrDataStr(qrData.qrData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Merge QR code image onto canvas for download
  const handleDownloadQR = () => {
    if (!qrCodeImage) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const qrImg = new window.Image();
    const logoImg = new window.Image();

    qrImg.crossOrigin = "anonymous";
    logoImg.crossOrigin = "anonymous";

    qrImg.src = qrCodeImage;
    qrImg.onload = () => {
      canvas.width = qrImg.width || 400;
      canvas.height = qrImg.height || 400;

      // 1. Draw base QR code
      ctx.drawImage(qrImg, 0, 0, canvas.width, canvas.height);

      // 2. Draw centered logo
      logoImg.src = "/logo.png";
      logoImg.onload = () => {
        const logoSize = canvas.width * 0.22;
        const logoX = (canvas.width - logoSize) / 2;
        const logoY = (canvas.height - logoSize) / 2;

        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8, 12);
        ctx.fill();

        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

        // Download output PNG
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `Gatify_Gatepass_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    };
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Visitor Access Generator
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Generate Visitor Gate Pass & QR
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
          Submit visitor permission details to generate a scannable QR gate pass for barrier entry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Pass Details Form */}
        <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Gate Pass Details
          </h2>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Purpose / Reason for Visit *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Visitor entry for maintenance, delivery, or guest event"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="glass-input w-full p-3 text-xs rounded-2xl focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Expected Time Duration / Slot *
              </label>
              <TimePicker value={time} onChange={setTime} />
            </div>

            <button
              type="submit"
              disabled={loading || !reason || !time}
              className="btn-liquid-primary w-full py-4 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 spring-press disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  Generate Scannable QR Pass
                </>
              )}
            </button>
          </form>
        </div>

        {/* QR Code Pass Preview Card */}
        <div className="glass-floating rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[380px] relative overflow-hidden">
          {qrCodeImage ? (
            <div className="space-y-6 w-full animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl border-4 border-cyan-400 mx-auto relative">
                <img
                  src={qrCodeImage}
                  alt="Visitor Gate Pass QR"
                  className="w-48 h-48 object-contain mx-auto"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <span>GATIFY VISITOR PASS</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono max-w-xs mx-auto truncate">
                  {qrDataStr}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleDownloadQR}
                  className="btn-liquid-primary py-2.5 px-4 rounded-2xl text-white text-xs font-bold flex items-center gap-1.5 spring-press"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-liquid-secondary py-2.5 px-4 rounded-2xl text-slate-200 text-xs font-semibold flex items-center gap-1.5 spring-press"
                >
                  <Printer className="w-4 h-4" />
                  Print Pass
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-12">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mx-auto">
                <QrCode className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-white">Gatify Spatial Gate Pass Preview</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Complete the gate pass form to render your visitor security credential.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
