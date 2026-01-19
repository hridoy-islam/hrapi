import { model, Schema } from "mongoose";
import { TImmigrationStatus } from "./immigrationStatus.interface";

const LogEntrySchema = new Schema({
  title: { type: String },
  date: { type: Date },
   document: { type: String },
  updatedBy: { type: Schema.Types.ObjectId,  ref: "User" },
});

const ImmigrationStatusSchema = new Schema<TImmigrationStatus>(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  
    nextCheckDate: { type: Date },
    logs: [LogEntrySchema],
  },
  { timestamps: true }
);

export const ImmigrationStatus = model<TImmigrationStatus>(
  "ImmigrationStatus",
  ImmigrationStatusSchema
);
