import mongoose from "mongoose";

export interface ICompanyDailyWorkFlowAccess {
  companyId: mongoose.Types.ObjectId;
  employees: mongoose.Types.ObjectId[];
  isActive: boolean;
}
