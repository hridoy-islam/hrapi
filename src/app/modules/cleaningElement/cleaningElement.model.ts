import { Schema, model } from "mongoose";
import { TCleaningElement } from "./cleaningElement.interface";

const CleaningElementSchema = new Schema<TCleaningElement>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    areaId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "CleaningArea",
    },

    element: {
      type: String,
      required: true,
      trim: true,
    },

    performanceParameter: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CleaningElement = model<TCleaningElement>(
  "CleaningElement",
  CleaningElementSchema
);
