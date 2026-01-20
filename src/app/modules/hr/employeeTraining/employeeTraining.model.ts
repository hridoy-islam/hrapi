import { model, Schema } from "mongoose";
import {
  TEmployeeTraining,
  TCompletionRecord,
} from "./employeeTraining.interface";

const CompletionRecordSchema = new Schema<TCompletionRecord>(
  {
    assignedDate: { type: Date },
    expireDate: { type: Date },
    completedAt: { type: Date },
    certificate: { type: String },
  }
);

const EmployeeTrainingSchema = new Schema<TEmployeeTraining>(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    trainingId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Training",
    },

    // Root fields for the CURRENT active training
    assignedDate: { type: Date, required: true },
    expireDate: { type: Date },
    certificate: { type: String },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "expired"],
      default: "pending",
    },

    // Archive of previous completions
    completionHistory: [CompletionRecordSchema],
  },
  { timestamps: true },
);

// Ensure unique pair (One document per Employee-Training pair)
EmployeeTrainingSchema.index(
  { employeeId: 1, trainingId: 1 },
  { unique: true },
);

export const EmployeeTraining = model<TEmployeeTraining>(
  "EmployeeTraining",
  EmployeeTrainingSchema,
);
