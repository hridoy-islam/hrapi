import { Types } from "mongoose";

// One record per company, listing the employees allowed on the cleaning module
export interface TCleaningAccess {
  companyId: Types.ObjectId;
  employeeId: Types.ObjectId[];
}
