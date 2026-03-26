import mongoose, { Schema, Document } from "mongoose";

export interface THoliday extends Document {
  userId: mongoose.Types.ObjectId;

  year: string; 

  holidayAllowance: number;
  holidayAccured: number;

  usedHours: number;
  bookedHours: number;
  requestedHours: number;
  remainingHours: number;

  unpaidLeaveTaken: number;
  unpaidBookedHours: number;
  unpaidLeaveRequest: number;

  hoursPerDay: number;

  createdAt: Date;
  updatedAt: Date;
}
