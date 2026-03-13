import { Types } from "mongoose";

export interface TAttendanceLog {
  _id?: Types.ObjectId;
  clockIn?: string;
  clockInDate?: string;
  clockOutDate?: string;
  clockOut?: string;
}

export interface TAttendance {
  _id?: Types.ObjectId;

  userId: Types.ObjectId;
  rotaId: Types.ObjectId;

  date: string;

  status: "clockin" | "clockout" | "completed" | "absent";

  attendanceLogs: TAttendanceLog[];

  totalDuration: number;

  clockType?: "face" | "qr" | "pin" | "manual";

  source?: "accessControl" | "desktopApp" | "mobileApp";

  deviceId?: string;

  location?: string;

  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}