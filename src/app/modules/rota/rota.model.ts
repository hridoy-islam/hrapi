import { Schema, model } from "mongoose";
import { TRota } from "./rota.interface";

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

const RotaSchema = new Schema<TRota>(
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
  },
  {
    timestamps: true,
  },
);

export const Rota = model<TRota>("Rota", RotaSchema);
