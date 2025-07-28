import { Types } from "mongoose";

export interface TEmployeeRate {
  
  shiftId: Types.ObjectId[];
  employeeId: Types.ObjectId;
  rates:any

}
