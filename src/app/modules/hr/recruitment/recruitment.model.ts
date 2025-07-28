import { model, Schema } from "mongoose";

import { string } from "zod";
import { TRecruitment } from "./recruitment.interface";

const recruitmentSchema = new Schema<TRecruitment>(
  {
    applicantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Applicant"
    },
    availableFrom: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    wtrDocumentUrl: {
      type: String,
    },
    area: {
      type: String,
      required: true,
    },
    isFullTime: {
      type: Boolean,
    },

    carTravelAllowance: {
      type: Boolean,
      required: true,
    },
    employmentType: {
      type: String,
      default: "part-time",
    },
    rightToWork: {
      hasExpiry: { type: Boolean },
      expiryDate: { type: Date },
    },
    payroll: {
      payrollNumber: { type: String },
      paymentMethod: { type: String, default: "cash" },
    },
    equalityInformation: {
      nationality: { type: String },
      religion: { type: String },
      hasDisability: { type: Boolean },
      disabilityDetails: { type: String },
    },
    beneficiary: {
      fullName: { type: String },
      relationship: { type: String },
      email: { type: String },
      mobile: { type: String },
      sameAddress: { type: Boolean },
      address: {
        line1: { type: String },
        line2: { type: String },
        city: { type: String },
        state: { type: String },
        postCode: { type: String },
        country: { type: String },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Recruitment = model<TRecruitment>(
  "Recruitment",
  recruitmentSchema
);
