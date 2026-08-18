import { NextResponse } from "next/server";
import QRCode from "qrcode";
import dbConnect from "@/lib/dbConnect";
import QrCode from "@/lib/models/QrCode";
import { verifyAuthToken } from "@/lib/auth";

export async function POST(req) {
  try {
    await verifyAuthToken(req);
    await dbConnect();

    const body = await req.json();
    const { reason, time } = body;

    if (!reason || !time) {
      return NextResponse.json(
        { success: false, message: "Reason and time are required." },
        { status: 400 }
      );
    }

    const qrData = `Reason: ${reason}, Time: ${time}, ID: ${Date.now()}`;

    // Options for high quality QR Code Base64 Data URL
    const qrOptions = {
      errorCorrectionLevel: "H",
      margin: 2,
      scale: 8,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    };

    const qrBase64 = await QRCode.toDataURL(qrData, qrOptions);

    const newQrCode = new QrCode({
      qrData,
      reason,
      time,
      qrBase64,
    });

    await newQrCode.save();

    return NextResponse.json(
      {
        message: "QR Code generated successfully!",
        qrImage: qrBase64,
        qrData,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in generateQrCode API:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, message: err.message || "Error generating QR code" },
      { status }
    );
  }
}
