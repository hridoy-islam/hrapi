import { Types } from "mongoose";

export interface TSignatureDoc {
  companyId: Types.ObjectId;

  content: string;
  signedDocument:string;
  document:string;
  envelopeId:string;
  status:string;
  submittedAt:Date;
  employeeId: Types.ObjectId;
  
}
