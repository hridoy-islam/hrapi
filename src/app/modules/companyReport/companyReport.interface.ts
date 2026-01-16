import { Types } from "mongoose";

export interface TCompanyReport {
  companyId: Types.ObjectId;
  subscriptionPlanId: Types.ObjectId;
  logMessage: string;
  createdAt: Date;
  updatedAt: Date;
  amount:Number
}
