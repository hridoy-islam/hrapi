import { Types } from "mongoose";

export interface TAttendance {
 
  userId: Types.ObjectId;
  shiftId?: Types.ObjectId;
  clockIn: string;

  clockOut?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  eventType: "clock_in" | "clock_out";
  clockType?: "face" | "qr" | "pin" | "manual";
  source: "accessControl" | "desktopApp" | "mobileApp";
  deviceId?: string;
  approvalRequired?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  breakTimes?: {
    breakStart: Date;
    breakEnd: Date;
  }[];
  screenshots?: {
    url: string;
    capturedAt : Date;
  }[];
  timestamp: Date
  
}
