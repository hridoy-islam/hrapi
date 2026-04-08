import { Types } from "mongoose";

export interface TSignatureDoc {
  companyId: Types.ObjectId;

  content: string;
  signedDocument:string;
  document:string;
  envelopeId:string;
  approverIds: Types.ObjectId[];
  signedByApprovers: Types.ObjectId[];
  status:string;
  submittedAt:Date;
  employeeId: Types.ObjectId;
  
}
