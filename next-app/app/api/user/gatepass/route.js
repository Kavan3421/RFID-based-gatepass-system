import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Gatepass from "@/lib/models/Gatepass";
import { verifyAuthToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await verifyAuthToken(req);
    await dbConnect();

    const body = await req.json();
    const { reason, time } = body;

    if (!reason || !time) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const gatepass = new Gatepass({
      name: user.name,
      enrollmentNumber: user.enrollmentNumber,
      rfid_tag: user.rfid_tag || "GUEST_RFID",
      reason,
      time,
    });

    const savedGatepass = await gatepass.save();

    return NextResponse.json(
      {
        message: "Your reason has been submitted successfully.",
        contact: savedGatepass,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error in Gatepass API:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error" },
      { status }
    );
  }
}
