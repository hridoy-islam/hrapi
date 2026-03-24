import { Types } from "mongoose";

export interface TSignatureDoc {
  companyId: Types.ObjectId;

  content: string;
  document:string;
  status:string;
  submittedAt:Date;
  employeeId: Types.ObjectId;
  
}
