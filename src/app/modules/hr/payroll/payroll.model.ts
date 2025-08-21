import { Schema, model, Types } from "mongoose";
import { TPayroll } from "./payroll.interface";

const PayrollSchema = new Schema<TPayroll>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    reason:{type: String},
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"], 
      default: "pending",
    },
    approvedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    netAmount: {
      type: Number,
      default:0
    },
  },
  {
    timestamps: true, 
  }
);

export const Payroll = model<TPayroll>("Payroll", PayrollSchema);
