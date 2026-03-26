import { Types } from "mongoose";

export interface TLeave {
  _id?: Types.ObjectId;

  holidayYear: string;

  userId: Types.ObjectId;
  companyId: Types.ObjectId;

  startDate: Date;
  endDate: Date;

  reason?: string; // optional (matches schema)

  status?: "pending" | "approved" | "rejected";

  holidayType: "holiday" | "absence" | "sick" | "family";

  totalDays?: number;
  totalHours?: number;

  leaveDays?: {
    leaveDate?: Date;
    leaveType?: "paid" | "unpaid" | "dayoff";
  }[];

  createdAt?: Date;
  updatedAt?: Date;
}