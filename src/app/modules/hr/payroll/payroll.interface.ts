import { Types } from "mongoose";

export interface TAttendanceLog {
  employementRateId?: Types.ObjectId;
  shiftId?: Types.ObjectId;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  payRate?: number;
  note?: string;
  bankHoliday?: boolean;
  bankHolidayId?: Types.ObjectId;
}

export interface TPayroll {
  userId: Types.ObjectId;
  companyId: Types.ObjectId;
  fromDate: Date;
  toDate: Date;
  note?: string;
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