/* eslint-disable no-unused-vars */
import { Schema, model, Types } from "mongoose";
import { TCompanyPolicy } from "./companyPolicy.interface";

const LogSchema = new Schema({
  title: { type: String },
  date: { type: Date },
  document: [{ type: String }],
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
});

const CompanyPolicySchema = new Schema<TCompanyPolicy>(
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

export const CompanyPolicy = model<TCompanyPolicy>("CompanyPolicy", CompanyPolicySchema);
