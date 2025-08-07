import { Types } from "mongoose";

export interface TLeave {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  status?: "pending" | "approved" | "rejected";
  holidayType?: string;
  title: string;
  holidayYear: string;
  totalDays?: number;
  totalHours?: number;
  leaveType:string;
  createdAt?: Date;
  updatedAt?: Date;
}