import { Types } from "mongoose";

export interface TAttendance {
  _id?: Types.ObjectId; // Optional: Useful if you ever need to access the ID directly
  userId: Types.ObjectId;
  shiftId?: Types.ObjectId;
  

  startDate?: string; 
  startTime?: string; 
  endDate?: string;   
  endTime?: string;   

  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };

  eventType: "clock_in" | "clock_out" | "manual"; // Added 'manual'
  clockType?: "face" | "qr" | "pin" | "manual";
  source: "accessControl" | "desktopApp" | "mobileApp";
  
  deviceId?: string;
  
  approvalRequired?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  
  notes?: string;
  
  duration?: number; 

  breakTimes?: {
    breakStart: Date;
    breakEnd: Date;
  }[];

  screenshots?: {
    url: string;
    capturedAt: Date;
  }[];

  
  timestamp?: Date; 
  
  createdAt?: Date;
  updatedAt?: Date;
}