import { Types } from "mongoose";

export interface TRequestDocument {
 
  userId: Types.ObjectId;
  documentType: DocumentType;
  requestDate: Date;
  status: string;
  startDate?: string;
  endDate?: string;
  document?: string;
  
}
