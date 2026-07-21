/* eslint-disable no-unused-vars */
import { Schema, model, Types } from "mongoose";
import { TLogEntry, TSupervision } from "./supervision.interface";

const LogEntrySchema = new Schema<TLogEntry>({
  title: { type: String, required: true },
  date: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  document: [{ type: String }],
  note: { type: String },
  scheduledDate: { type: Date },
  completionDate: { type: Date },
  action: { type: String, enum: ['update', 'close', 'reopen', 'create'] },
  previousStatus: { type: Boolean },
  newStatus: { type: Boolean },
});

const SupervisionSchema = new Schema<TSupervision>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Core Supervision Fields
    scheduledDate: {
      type: Date,

    },

    completionDate: {
      type: Date,
    },
    sessionNote: {
      type: String,
    },
isClosed:{
      type:Boolean,
      default:false
    },
    logs: [LogEntrySchema],
  },
  { timestamps: true }, // Handles createdAt and updatedAt automatically
);

export const Supervision = model<TSupervision>(
  "Supervision",
  SupervisionSchema,
);
