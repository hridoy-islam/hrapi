import mongoose, { Schema, Document } from "mongoose";

export interface THoliday extends Document {
  userId: mongoose.Types.ObjectId;
  year: number;
  holidayAccured: number; 
  requestedHours:number,        // Total entitlement in hours (e.g., 28 days × 8 = 224)
  usedHours: number;          // Hours already used
  remainingHours: number;     // Total remaining in hours
  hoursPerDay: number;        // Fixed at 8 (can be dynamic if needed)
  holidaysTaken: {
    startDate: Date;
    endDate: Date;
    totalDays: number;
    totalHours: number;
    reason?: string;
    status: "pending" | "approved" | "rejected";
  }[];
  createdAt: Date;
  updatedAt: Date;
}
