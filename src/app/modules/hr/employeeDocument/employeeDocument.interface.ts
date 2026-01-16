import { Types } from "mongoose";

export interface TEmployeeDocument {
  
  employeeId: Types.ObjectId;
  documentTitle: string; 
  documentUrl: string;

}
