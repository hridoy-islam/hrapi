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
    visaCheckDate: {
      type: Number,
      default: 0,
    },
    appraisalCheckDate: {
      type: Number,
      default: 0,
    },
     immigrationCheckDate: {
      type: Number,
      default: 0,
    },
     spotCheckDate: {
      type: Number,
      default: 0,
    },
     supervisionCheckDate: {
      type: Number,
      default: 0,
    },
     disciplinaryCheckDate: {
      type: Number,
      default: 0,
    },
     spotCheckDuration: {
      type: Number,
      default: 0,
    },
     supervisionDuration: {
      type: Number,
      default: 0,
    },
     qaCheckDuration: {
      type: Number,
      default: 0,
    },
     qaCheckDate: {
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
