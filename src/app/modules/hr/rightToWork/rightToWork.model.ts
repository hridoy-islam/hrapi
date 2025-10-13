import { model, Schema } from "mongoose";
import { TRightToWork } from "./rightToWork.interface";

const LogEntrySchema = new Schema({
  title: { type: String },
  date: { type: Date },
   document: { type: String },
  updatedBy: { type: Schema.Types.ObjectId,  ref: "User" },
});

const RightToWorkSchema = new Schema<TRightToWork>(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    startDate: { type: Date },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "closed", "expired","needs-check"],
      default: "active",
    },
    // documents: [{ type: String }],
    nextCheckDate: { type: Date },
    logs: [LogEntrySchema],
  },
  { timestamps: true }
);

export const RightToWork = model<TRightToWork>(
  "RightToWork",
  RightToWorkSchema
);
