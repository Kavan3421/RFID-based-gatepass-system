import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = mongoose.connection.useDb("test");
    const adminCollection = db.collection("admin");

    const admin = await adminCollection.findOne({ email });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { success: false, message: "Incorrect password" },
        { status: 403 }
      );
    }

    const token = signToken({ id: admin._id });

    return NextResponse.json(
      {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name || "Administrator",
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in AdminLogin API:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
