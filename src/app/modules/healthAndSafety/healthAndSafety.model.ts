/* eslint-disable no-unused-vars */
import { Schema, model, Types } from "mongoose";
import { THealthAndSafety } from "./healthAndSafety.interface";

const LogSchema = new Schema({
  title: { type: String },
  date: { type: Date },
  document: [{ type: String }],
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
});

const healthAndSafetySchema = new Schema<THealthAndSafety>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String },
    startDate: { type: Date },
    expiryDate: { type: Date },
    document: [{ type: String }],

    logs: [LogSchema],
  },
  { timestamps: true },
);

export const HealthAndSafety = model<THealthAndSafety>("HealthAndSafety", healthAndSafetySchema);
