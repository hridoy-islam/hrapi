import { Schema, model } from "mongoose";
import { TJobBoard } from "./jobBoard.interface";

const JobBoardSchema = new Schema<TJobBoard>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Employees assigned to the board - badges on the UI
    employeeId: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const JobBoard = model<TJobBoard>("JobBoard", JobBoardSchema);
