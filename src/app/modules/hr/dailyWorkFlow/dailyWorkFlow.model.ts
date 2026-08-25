import mongoose, { model, Schema } from "mongoose";

import { TDailyWorkFlow } from "./dailyWorkFlow.interface";

const dailyWorkFlowTaskSchema = new Schema(
  {
    taskName: {
      type: String,
      required: true,
            trim:true

    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    note: {
      type: String,
    },
  },
 
);

const dailyWorkFlowSchema = new Schema<TDailyWorkFlow>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    date: {
      type: Date,
      required: true,
    },
    tasks: {
      type: [dailyWorkFlowTaskSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const DailyWorkFlow = model<TDailyWorkFlow>(
  "DailyWorkFlow",
  dailyWorkFlowSchema
);
