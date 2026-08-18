import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const scanStartTime = parseInt(searchParams.get("since") || "0");

    // 1. Check if hardware script encountered serial error (scanner not attached)
    const logs = [
      ...(global._hardwareLogs?.read_tags_entry || []),
      ...(global._hardwareLogs?.read_tags_exit || []),
    ];

    const hasSerialError = logs.some((l) =>
      l.message.includes("[SERIAL ERROR]") ||
      l.message.includes("Could not access RFID reader") ||
      l.message.includes("SerialException")
    );

    if (hasSerialError) {
      return NextResponse.json({
        success: false,
        noScanner: true,
        message: "No RFID scanner attached to COM port. Please connect RFID hardware scanner.",
      });
    }

    // 2. Search for live scans captured in hardware process logs since scan requested
    let liveTag = null;
    let liveTagTime = 0;

    for (const l of logs.slice().reverse()) {
      const match =
        l.message.match(/RFID Tag:?\s*([A-Za-z0-9]+)/i) ||
        l.message.match(/Log saved to database:?\s*{.*'rfid_tag':\s*'([^']+)'/i);

      if (match && match[1]) {
        liveTag = match[1];
        liveTagTime = Date.now();
        break;
      }
    }

    // Only accept live scans captured within the last 15 seconds
    if (liveTag && (scanStartTime === 0 || liveTagTime >= scanStartTime - 2000)) {
      return NextResponse.json({
        success: true,
        rfid_tag: liveTag,
        timestamp: new Date(liveTagTime),
      });
    }

    // 3. Check MongoDB rfid_logs_entry for NEW scans created after scanStartTime
    await dbConnect();
    const db = mongoose.connection.db;
    const sinceDate = scanStartTime > 0 ? new Date(scanStartTime - 2000) : new Date(Date.now() - 15000);

    const recentEntry = await db
      .collection("rfid_logs_entry")
      .find({ timestamp: { $gte: sinceDate } })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (recentEntry.length > 0) {
      return NextResponse.json({
        success: true,
        rfid_tag: recentEntry[0].rfid_tag,
        timestamp: recentEntry[0].timestamp,
      });
    }

    return NextResponse.json({
      success: false,
      message: "Listening for physical RFID scan...",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
