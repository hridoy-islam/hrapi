import { model, Schema } from "mongoose";
import { THoliday } from "./holiday.interface";

const HolidaySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    year: { type: String, required: true },
    holidayAllowance: { type: Number, default: 0 },
    holidayAccured: { type: Number, default: 0 },
    usedHours: { type: Number, default: 0 },
    requestedHours: { type: Number, default: 0 },
    remainingHours: { type: Number, default: 0 },
    unpaidLeaveTaken: { type: Number, default: 0 },
    unpaidLeaveRequest: { type: Number, default: 0 },

    hoursPerDay: { type: Number, default: 8 },
  },
  { timestamps: true }
);

export const Holiday = model<THoliday>("Holiday", HolidaySchema);
