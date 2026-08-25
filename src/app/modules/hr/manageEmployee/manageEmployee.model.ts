import { model, Schema } from "mongoose";

import { ICompanyDailyWorkFlowAccess } from "./manageEmployee.interface";

const companyDailyWorkFlowAccessSchema = new Schema<ICompanyDailyWorkFlowAccess>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "User",
    },
    employees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CompanyDailyWorkFlowAccess = model<ICompanyDailyWorkFlowAccess>(
  "CompanyDailyWorkFlowAccess",
  companyDailyWorkFlowAccessSchema
);
