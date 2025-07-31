import { model, Schema } from "mongoose";
import { THoliday } from "./holiday.interface";

const HolidaySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    year: { type: String, required: true },
    totalHours: { type: Number, default: 224 }, // 28 days × 8 hrs
    usedHours: { type: Number, default: 0 },
    remainingHours: { type: Number, default: 224 },
    hoursPerDay: { type: Number, default: 8 },
    holidaysTaken: [
      {
        startDate: { type: Date },
        endDate: { type: Date },
        totalDays: { type: Number }, // Used for display
        totalHours: { type: Number }, // Used for calculations
        reason: { type: String, required: false, default: null },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
      },
    ],
  },
  { timestamps: true }
);

export const Holiday = model<THoliday>("Holiday", HolidaySchema);
