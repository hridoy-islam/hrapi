import { Schema, model } from "mongoose";
import { TCompanyBranch } from "./companyBranch.interface";

const CompanyBranchSchema = new Schema<TCompanyBranch>(
  {
    branchName: {
      type: String,
      required: true,
    },

    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export const CompanyBranch = model<TCompanyBranch>(
  "CompanyBranch",
  CompanyBranchSchema,
);
