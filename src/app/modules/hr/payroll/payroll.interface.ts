import { Types } from "mongoose";

export interface TAttendanceLog {
  attendanceId?: Types.ObjectId;
  payRate: number;
  duration: number;
}

export interface TPayroll {
  userId: Types.ObjectId;
  companyId: Types.ObjectId;
  fromDate: Date;
  toDate: Date;
  note?: string;
  refId?: string;

  status: "pending" | "approved" | "rejected";
  reason?: string;
  totalHour?: number;
  approvedBy?: Types.ObjectId;
  totalAmount: number;
  netAmount: number;
  attendanceList: TAttendanceLog[];
  createdAt?: Date;
  updatedAt?: Date;
}