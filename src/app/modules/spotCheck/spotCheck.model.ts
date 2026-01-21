/* eslint-disable no-unused-vars */
import { Schema, model, Types } from "mongoose";
import { TSpotCheck } from "./spotCheck.interface";

const LogEntrySchema = new Schema({
  title: { type: String },
  date: { type: Date },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  document:{ type: String },
});

const SpotCheckSchema = new Schema<TSpotCheck>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // DBS Certificate Details
    disclosureNumber: { type: String },
    dbsDocumentUrl: { type: String },
    dateOfIssue: { type: Date },
    expiryDate: { type: Date },
    logs: [LogEntrySchema],
  },
  { timestamps: true },
);

export const SpotCheck = model<TSpotCheck>("SpotCheck", SpotCheckSchema);
