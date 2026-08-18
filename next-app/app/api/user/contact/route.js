import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Feedback from "@/lib/models/Feedback";
import { verifyAuthToken } from "@/lib/auth";

export async function POST(req) {
  try {
    await verifyAuthToken(req);
    await dbConnect();

    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const contactMessage = new Feedback({
      name,
      email,
      message,
    });

    const savedMessage = await contactMessage.save();

    return NextResponse.json(
      {
        message: "Your message has been submitted successfully.",
        contact: savedMessage,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error in Contact API:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error" },
      { status }
    );
  }
}
