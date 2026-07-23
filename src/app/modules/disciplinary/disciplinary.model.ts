/* eslint-disable no-unused-vars */
import { Schema, model } from "mongoose";
import { TLogEntry, TDisciplinary } from "./disciplinary.interface";

const LogEntrySchema = new Schema<TLogEntry>({
  title: { type: String },
  date: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  document: [{ type: String }],
  note: { type: String },
  issueDeadline: { type: Date },
  extendDeadline: { type: Date },
  action: { type: String, enum: ['update', 'close', 'reopen', 'create'] },
  previousStatus: { type: Boolean },
  newStatus: { type: Boolean },
});

const DisciplinarySchema = new Schema<TDisciplinary>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issueDeadline: {
      type: Date,
    },
    extendDeadline: {
      type: Date,
    },
    issueDocument: { type: String },
    issueNote: { type: String },
    action: { type: String },
    isClosed: { type: Boolean, default: false },
    logs: [LogEntrySchema],
  },
  { timestamps: true },
);

export const Disciplinary = model<TDisciplinary>(
  "Disciplinary",
  DisciplinarySchema,
);
