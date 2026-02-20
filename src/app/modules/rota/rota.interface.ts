import { Types } from "mongoose";

export interface TRota {
  companyId: Types.ObjectId;
  employeeId: string;
  startTime?: string; 
  endTime?: string;  
  note?: string;     
  shiftName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  color: string;
}