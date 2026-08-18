import jwt from "jsonwebtoken";
import dbConnect from "./dbConnect";
import User from "./models/User";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT || process.env.JWT_SECRET || "ssip@hacking";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export async function verifyAuthToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw { status: 401, message: "You are not authenticated!" };
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw { status: 401, message: "You are not authenticated!" };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw { status: 403, message: "Token is invalid or expired!" };
  }

  if (!decoded || !decoded.id) {
    throw { status: 403, message: "Invalid token!" };
  }

  await dbConnect();
  const user = await User.findById(decoded.id);
  if (!user) {
    throw { status: 404, message: "User not found!" };
  }

  return user.toObject();
}

export async function verifyAdminAuthToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw { status: 401, message: "You are not authenticated!" };
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw { status: 401, message: "You are not authenticated!" };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw { status: 403, message: "Token is invalid or expired!" };
  }

  if (!decoded || !decoded.id) {
    throw { status: 403, message: "Invalid token!" };
  }

  await dbConnect();
  const db = mongoose.connection.useDb("test");
  const adminCollection = db.collection("admin");

  const admin = await adminCollection.findOne({ _id: new mongoose.Types.ObjectId(decoded.id) });
  if (!admin) {
    throw { status: 404, message: "Admin not found!" };
  }

  return admin;
}
