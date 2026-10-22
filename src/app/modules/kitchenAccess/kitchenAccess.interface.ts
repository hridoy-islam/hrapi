import { Types } from "mongoose";

// One record per company, listing the employees allowed on the kitchen log module
export interface TKitchenAccess {
  companyId: Types.ObjectId;
  employeeId: Types.ObjectId[];
}
