import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createError } from "../error.js";
import User from "../models/User.js";
import Feedback from "../models/Feedback.js";
import Gatepass from "../models/Gatepass.js";
import mongoose from "mongoose";

dotenv.config();

export const UserRegister = async (req, res, next) => {
  try {
    const { name, email, vehicleNumber, enrollmentNumber, password } = req.body;
    console.log(req.body);

    // Check for existing email
    const existingEmail = await User.findOne({ email }).exec();

    if (existingEmail) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists" });
    }

    // Check for existing vehicle number
    const existingVehicle = await User.findOne({ vehicleNumber }).exec();

    if (existingVehicle) {
      return res
        .status(409)
        .json({ success: false, message: "Vehicle number already exists" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = new User({
      name,
      email,
      vehicleNumber,
      enrollmentNumber,
      password: hashedPassword,
    });
    const createdUser = await user.save();

    const token = jwt.sign({ id: createdUser._id }, process.env.JWT, {
      expiresIn: "1y",
    });

    console.log("Response Data:", { token, user: createdUser });

    return res.status(201).json({ token, user });
  } catch (err) {
    console.error("Error occurred:", err); // Log any unexpected errors
    next(err);
  }
};

export const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).exec();
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return next(createError(403, "Incorrect password"));
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT, {
      expiresIn: "24h",
    });
    return res.status(200).json({ token, user });
  } catch (err) {
    next(err);
  }
};

export const getCardByDate = async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    console.log(date);

    // const startOfDay = new Date(
    //   date.getFullYear(),
    //   date.getMonth(),
    //   date.getDate()
    // );
    // const endOfDay = new Date(
    //   date.getFullYear(),
    //   date.getMonth(),
    //   date.getDate() + 1
    // );

    const startOfDay = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const endOfDay = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    );

    const db = mongoose.connection.db;
    const entryCollection = db.collection("rfid_logs_entry");
    const exitCollection = db.collection("rfid_logs_exit");

    const currentUser = req.user;
    if (!currentUser || !currentUser.rfid_tag) {
      return res.status(401).json({ message: "Unauthorized user." });
    }
    const currentRfidTag = req.user.rfid_tag;

    const entryLogs = await entryCollection
      .find({ timestamp: { $gte: startOfDay, $lt: endOfDay } })
      .toArray();
    const exitLogs = await exitCollection
      .find({ timestamp: { $gte: startOfDay, $lt: endOfDay } })
      .toArray();

    if (!entryLogs.length && !exitLogs.length) {
      return res
        .status(404)
        .json({ message: "No logs found for the specified date." });
    }

    const logsByTag = {};
    const allLogs = [...entryLogs, ...exitLogs];

    for (const log of allLogs) {
      const { rfid_tag, timestamp } = log;

      if (rfid_tag !== currentRfidTag) {
        continue; 
      }

      const type = entryLogs.includes(log) ? "entry" : "exit";

      const utcDate = new Date(timestamp);
      const adjustedDate = new Date(utcDate.getTime() - 5.5 * 60 * 60 * 1000);
      const formattedTimestamp = adjustedDate.toLocaleString("en-IN", {
        hour12: true,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      if (!logsByTag[rfid_tag]) {
        logsByTag[rfid_tag] = { logs: [] };
      }

      logsByTag[rfid_tag].logs.push({ type, timestamp: formattedTimestamp });
    }

    res.status(200).json({ logs: logsByTag });
  } catch (err) {
    console.error("Error in getCardByDate:", err);
    next(err);
  }
};

export const ContactMessage = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return next(createError(400, "All fields are required."));
    }

    const contactMessage = new Feedback({
      name,
      email,
      message,
    });

    const savedMessage = await contactMessage.save();

    return res.status(201).json({
      message: "Your message has been submitted successfully.",
      contact: savedMessage,
    });
  } catch (err) {
    next(err);
  }
};

export const gatePass = async (req, res, next) => {
  try {
    const { reason, time } = req.body;

    if (!reason || !time ) {
      return next(createError(400, "All fields are required."));
    }

    const currentUser = req.user;
    const name = currentUser.name;
    const enrollmentNumber = currentUser.enrollmentNumber;
    const rfid_tag = currentUser.rfid_tag;

    const gatepass = new Gatepass({
      name,
      enrollmentNumber,
      rfid_tag,
      reason,
      time,
    });

    const savedMessage = await gatepass.save();

    return res.status(201).json({
      message: "Your reason has been submitted successfully.",
      contact: savedMessage,
    });
  } catch (err) {
    next(err);
  }
};