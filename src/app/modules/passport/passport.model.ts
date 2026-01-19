/* eslint-disable no-unused-vars */
import { Schema, model, Types } from "mongoose";
import { TPassport } from "./passport.interface";
const LogEntrySchema = new Schema({
  title: { type: String },
  date: { type: Date },
  document: { type: String },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
});
const PassportSchema = new Schema<TPassport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    passportNumber: { type: String },
    passportExpiryDate: { type: Date },
    logs: [LogEntrySchema],
  },
  { timestamps: true },
);

export const Passport = model<TPassport>("Passport", PassportSchema);
