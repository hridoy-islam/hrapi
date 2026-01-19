import { model, Schema } from "mongoose";
import { TVisaCheck } from "./visaCheck.interface";

const LogEntrySchema = new Schema({
  title: { type: String },
  date: { type: Date },
  document: { type: String },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
});

const VisaCheckSchema = new Schema<TVisaCheck>(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    status: {
      type: String,
      enum: ["active", "closed", "expired", "needs-check"],
      default: "active",
    },
    startDate: { type: Date },
    expiryDate: { type: Date },
    logs: [LogEntrySchema],
  },
  { timestamps: true },
);

export const VisaCheck = model<TVisaCheck>("VisaCheck", VisaCheckSchema);
