import { Schema, model } from "mongoose";
import { TPlannedRota } from "./plannedRota.interface";

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

const PlannedRotaSchema = new Schema<TPlannedRota>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    employeeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    startTime: {
      type: String,
    },

    endTime: {
      type: String,
    },

    note: {
      type: String,
      default: "",
    },

    leaveType: {
      type: String,
    },

    shiftName: {
      type: String,
    },

    startDate: {
      type: String,
    },

    endDate: {
      type: String,
    },

    color: {
      type: String,
    },

    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "publish", "completed"],
      default: "pending",
    },

    history: [historySchema],
    byNotice:{ type: Boolean, default: false },
    byEmail:{ type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

export const PlannedRota = model<TPlannedRota>("PlannedRota", PlannedRotaSchema);
