// models/Leave.ts

import { Schema, model } from "mongoose";
import { Types } from "mongoose";
const historySchema = new Schema(
  {
    message: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const LeaveSchema = new Schema(
  {
    holidayYear: { type: String, required: true }, // e.g., "2023-2024"
    userId: { type: Types.ObjectId, ref: "User", required: true },
    companyId: { type: Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    holidayType: {
      type: String,
      enum: ["holiday", "absence", "sick", "family"],
      required: true,
    },
    totalDays: { type: Number },
    totalHours: { type: Number },
    documents: [
      {
        type: String,
      },
    ],
    leaveDays: [
      {
        leaveDate: {
          type: Date,
        },
        leaveType: {
          type: String,
          enum: ["paid", "unpaid", "dayoff"],
        },
        duration: {
          type: Number,
        },
      },
    ],

    history: [historySchema],
  },
  { timestamps: true },
);

export const Leave = model("Leave", LeaveSchema);
