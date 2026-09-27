import { Schema, model } from "mongoose";
import { TCleaningArea } from "./cleaningArea.interface";
import { CLEANING_TYPES } from "./cleaningArea.constant";

const CleaningAreaSchema = new Schema<TCleaningArea>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    areaName: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: CLEANING_TYPES,
      required: true,
    },

    roomNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CleaningArea = model<TCleaningArea>(
  "CleaningArea",
  CleaningAreaSchema
);
