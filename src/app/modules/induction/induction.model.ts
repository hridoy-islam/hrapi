/* eslint-disable no-unused-vars */
import { Schema, model } from "mongoose";
import { TLogEntry, TInduction } from "./induction.interface";
import { string } from "zod";

const LogEntrySchema = new Schema<TLogEntry>({
  title: { type: String },
  date: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  document: { type: String },
});

const InductionSchema = new Schema<TInduction>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    inductionDate: {
      type: Date,
    },
    noPromotion:{type:Boolean,default:false},
    action: { type: String },

    logs: [LogEntrySchema],
  },
  { timestamps: true },
);

export const Induction = model<TInduction>("Induction", InductionSchema);
