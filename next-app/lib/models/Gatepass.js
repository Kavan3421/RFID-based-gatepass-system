import mongoose from "mongoose";

const gatepassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    enrollmentNumber: {
      type: Number,
      required: true,
    },
    rfid_tag: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Gatepass || mongoose.model("Gatepass", gatepassSchema);
