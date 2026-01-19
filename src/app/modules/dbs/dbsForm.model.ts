/* eslint-disable no-unused-vars */
import { Schema, model, Types } from "mongoose";
import { TDbsForm } from "./dbsForm.interface";

const LogEntrySchema = new Schema({
  title: { type: String },
  date: { type: Date },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  document:{ type: String },
});

const DbsFormSchema = new Schema<TDbsForm>(
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

export const DbsForm = model<TDbsForm>("DbsForm", DbsFormSchema);
