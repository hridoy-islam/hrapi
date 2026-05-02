/* eslint-disable no-unused-vars */
import { Schema, model } from "mongoose";
import { TSickNote } from "./sickNote.interface";

const SickNoteSchema = new Schema<TSickNote>(
  {
    note: {
      type: String,
  
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
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
    documents: {
      type: [String],
      default: [],
    },
   
  },
  {
    timestamps: true,
  },
);

export const SickNote = model<TSickNote>("SickNote", SickNoteSchema);
