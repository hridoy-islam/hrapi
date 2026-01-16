import { Schema, model } from "mongoose";
import { TScheduleCheck } from "./scheduleCheck.interface";

const ScheduleCheckSchema = new Schema<TScheduleCheck>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    dbsCheckDate: {
      type: Number,
      default: 0,
    },
    rtwCheckDate: {
      type: Number,
      default: 0,
    },
    passportCheckDate: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const ScheduleCheck = model<TScheduleCheck>(
  "ScheduleCheck",
  ScheduleCheckSchema
);
