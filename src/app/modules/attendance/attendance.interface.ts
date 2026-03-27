import { Types } from "mongoose";

export interface TAttendance {
  _id?: Types.ObjectId;

  // User References
  userId?: Types.ObjectId;
  serviceUserId?: Types.ObjectId;
  rotaId?: Types.ObjectId;
  isApproved?: boolean;

  // Visitor Fields
  visitorName?: string;
  visitorPhone?: string;

  userType?: "employee" | "service_user" | "visitor";

  // Clock Times
  clockIn?: string;
  clockInDate?: string;

  clockOut?: string;
  clockOutDate?: string;

  status: "clockin" | "clockout" | "completed" | "absent";

  totalDuration?: number;

  clockType?: "face" | "qr" | "pin" | "manual";

  source?: "accessControl" | "desktopApp" | "mobileApp";

  deviceId?: string;

  location?: string;

  visitReason?: string;
  notes?: string;

  companyId?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
  history?:any
}