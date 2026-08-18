import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { verifyAdminAuthToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// GET /api/admin/users - Fetch all registered users
export async function GET(req) {
  try {
    await verifyAdminAuthToken(req);
  } catch (err) {
    return NextResponse.json({ message: err.message || "Unauthorized admin access" }, { status: err.status || 401 });
  }

  await dbConnect();

  try {
    const users = await User.find({}).sort({ createdAt: -1 }).select("-password");
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/admin/users - Register a new user from Admin Console
export async function POST(req) {
  try {
    await verifyAdminAuthToken(req);
  } catch (err) {
    return NextResponse.json({ message: err.message || "Unauthorized admin access" }, { status: err.status || 401 });
  }

  await dbConnect();

  try {
    const { name, email, vehicleNumber, enrollmentNumber, rfid_tag, password } = await req.json();

    if (!name || !email || !vehicleNumber || !enrollmentNumber || !password) {
      return NextResponse.json({ message: "All required user fields must be provided" }, { status: 400 });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { vehicleNumber }, { enrollmentNumber }],
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email, vehicle number, or enrollment ID already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      vehicleNumber,
      enrollmentNumber,
      rfid_tag: rfid_tag || "",
      password: hashedPassword,
    });

    return NextResponse.json(
      { message: "User registered successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT /api/admin/users - Assign / Update RFID tag or user details
export async function PUT(req) {
  try {
    await verifyAdminAuthToken(req);
  } catch (err) {
    return NextResponse.json({ message: err.message || "Unauthorized admin access" }, { status: err.status || 401 });
  }

  await dbConnect();

  try {
    const { userId, rfid_tag, name, vehicleNumber, enrollmentNumber } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const updateData = {};
    if (rfid_tag !== undefined) updateData.rfid_tag = rfid_tag;
    if (name) updateData.name = name;
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;
    if (enrollmentNumber) updateData.enrollmentNumber = enrollmentNumber;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User RFID details updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/users - Remove user
export async function DELETE(req) {
  try {
    await verifyAdminAuthToken(req);
  } catch (err) {
    return NextResponse.json({ message: err.message || "Unauthorized admin access" }, { status: err.status || 401 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User removed successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
