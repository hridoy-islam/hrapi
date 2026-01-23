import { Types } from "mongoose";

export interface TCompanyBranch {
  companyId: Types.ObjectId;

  branchName: string;
  
}
