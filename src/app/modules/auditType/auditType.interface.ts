import { Types } from "mongoose";

export interface TAuditType {
  companyId: Types.ObjectId
  title:string;
  status:string;
}
