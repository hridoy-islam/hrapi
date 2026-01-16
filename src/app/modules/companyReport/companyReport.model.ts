import { Schema, model, Types } from "mongoose";
import { TCompanyReport } from "./companyReport.interface";

const CompanyReportSchema = new Schema<TCompanyReport>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    subscriptionPlanId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "SubscriptionPlan",
    },
    logMessage: {
      type: String,
      required: true,
      trim: true,
    },
    amount:{
      type: Number,
      required:true
    }
  },
  {
    timestamps: true,
  }
);

export const CompanyReport = model<TCompanyReport>(
  "CompanyReport",
  CompanyReportSchema
);
