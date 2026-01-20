import { model, Schema } from "mongoose";
import { TAppraisal } from "./appraisal.interface";

const LogEntrySchema = new Schema({
  title: { type: String },
  date: { type: Date },
   document: { type: String },
  updatedBy: { type: Schema.Types.ObjectId,  ref: "User" },
});

const AppraisalSchema = new Schema<TAppraisal>(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  
    nextCheckDate: { type: Date },
    logs: [LogEntrySchema],
  },
  { timestamps: true }
);

export const Appraisal = model<TAppraisal>(
  "Appraisal",
  AppraisalSchema
);
