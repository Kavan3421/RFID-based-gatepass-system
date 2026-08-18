import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
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
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database connection failed" },
        { status: 500 }
      );
    }

    const entryCollection = db.collection("rfid_logs_entry");
    const exitCollection = db.collection("rfid_logs_exit");
    const usersCollection = db.collection("users");

    const entryLogs = await entryCollection
      .find({ timestamp: { $gte: startOfDay, $lt: endOfDay } })
      .toArray();
    const exitLogs = await exitCollection
      .find({ timestamp: { $gte: startOfDay, $lt: endOfDay } })
      .toArray();

    if (!entryLogs.length && !exitLogs.length) {
      return NextResponse.json(
        { message: "No logs found for the specified date.", logs: {} },
        { status: 200 }
      );
    }

    const logsByTag = {};
    const allLogs = [...entryLogs, ...exitLogs];

    for (const log of allLogs) {
      const { rfid_tag, timestamp } = log;
      const type = entryLogs.includes(log) ? "entry" : "exit";

      const utcDate = new Date(timestamp);
      const formattedTimestamp = utcDate.toLocaleString("en-IN", {
        hour12: true,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const user = await usersCollection.findOne({ rfid_tag });
      const enrollmentNumber = user ? user.enrollmentNumber : "N/A";
      const name = user ? user.name : "Unknown User";

      if (!logsByTag[rfid_tag]) {
        logsByTag[rfid_tag] = { logs: [] };
      }
      logsByTag[rfid_tag].logs.push({
        type,
        enrollmentNumber,
        name,
        timestamp: formattedTimestamp,
      });
    }

    return NextResponse.json({ logs: logsByTag }, { status: 200 });
  } catch (err) {
    console.error("Error in Admin databydate API:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error" },
      { status }
    );
  }
}
