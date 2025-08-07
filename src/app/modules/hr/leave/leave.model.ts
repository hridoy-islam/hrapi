// models/Leave.ts

import { Schema, model } from "mongoose";
import { Types } from "mongoose";

const LeaveSchema = new Schema(
  {
    holidayYear: { type: String, required: true }, // e.g., "2023-2024"
    userId: { type: Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String,  },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    holidayType: { type: String },
    totalDays: { type: Number }, // calculated
    totalHours: { type: Number }, // calculated
    leaveType:{type: String, enum: ["paid", "unpaid"]},
  },
  { timestamps: true }
);

export const Leave = model("Leave", LeaveSchema);
