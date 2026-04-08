import { Types } from "mongoose";

export interface TRota {
  companyId: Types.ObjectId;
  employeeId: Types.ObjectId;
  startTime?: string;
  endTime?: string;
  note?: string;
  shiftName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  color: string;
  departmentId: Types.ObjectId;
  status: string;
  attendanceLogs:any;
  history:any
  byNotice?: boolean;
  byEmail?: boolean;
}
