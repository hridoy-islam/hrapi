import { Types } from "mongoose";

export interface TServiceUserDocument {
  
  serviceUserId: Types.ObjectId;
  documentTitle: string; 
  documentUrl: string;
  note: string;

}
