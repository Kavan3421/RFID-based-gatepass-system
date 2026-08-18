import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Gatepass from "@/lib/models/Gatepass";
import { verifyAdminAuthToken } from "@/lib/auth";

export async function GET(req) {
  try {
    await verifyAdminAuthToken(req);

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const startOfDay = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const endOfDay = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    );

    await dbConnect();
    const gatepassLogs = await Gatepass.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    if (!gatepassLogs.length) {
      return NextResponse.json(
        { message: "No gatepass logs found for the specified date.", logs: {} },
        { status: 200 }
      );
    }

    const logsByTag = {};
    for (const log of gatepassLogs) {
      const { rfid_tag, time, reason, name, enrollmentNumber } = log;

      if (!logsByTag[rfid_tag]) {
        logsByTag[rfid_tag] = { logs: [] };
      }
      logsByTag[rfid_tag].logs.push({
        enrollmentNumber,
        name,
        reason,
        time,
      });
    }

    return NextResponse.json({ logs: logsByTag }, { status: 200 });
  } catch (err) {
    console.error("Error in Admin passbydate API:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error" },
      { status }
    );
  }
}
