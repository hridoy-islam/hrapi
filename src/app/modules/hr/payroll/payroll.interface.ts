import { Types } from "mongoose";

export interface TPayroll {
 
  userId: Types.ObjectId;
  fromDate?: Date;
  toDate?: Date;
  status:string;
  reason:string;
  approvedBy?:Types.ObjectId,
  netAmount:number,
  
}
