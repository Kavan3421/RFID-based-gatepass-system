import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, vehicleNumber, enrollmentNumber, password } = body;

    if (!name || !email || !vehicleNumber || !enrollmentNumber || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check for existing email
    const existingEmail = await User.findOne({ email }).exec();
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 409 }
      );
    }

    // Check for existing vehicle number
    const existingVehicle = await User.findOne({ vehicleNumber }).exec();
    if (existingVehicle) {
      return NextResponse.json(
        { success: false, message: "Vehicle number already exists" },
        { status: 409 }
      );
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = new User({
      name,
      email,
      vehicleNumber,
      enrollmentNumber: Number(enrollmentNumber),
      password: hashedPassword,
    });

    const createdUser = await user.save();

    const token = signToken({ id: createdUser._id });

    const userObject = createdUser.toObject();
    delete userObject.password;

    return NextResponse.json({ token, user: userObject }, { status: 201 });
  } catch (err) {
    console.error("Error in UserRegister API:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
