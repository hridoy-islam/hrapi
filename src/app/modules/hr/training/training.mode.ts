import { model, Schema } from "mongoose";

import { string } from "zod";

import { TrainingModule } from "./training.interface";

const trainingSchema = new Schema<TrainingModule>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
    },

    validityDays: {
      type: Number,
    },
    reminderBeforeDays: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const Training = model<TrainingModule>("Training", trainingSchema);
