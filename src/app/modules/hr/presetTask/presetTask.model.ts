import mongoose, { model, Schema } from "mongoose";

import { TPresetTask } from "./presetTask.interface";

const presetTaskSchema = new Schema<TPresetTask>(
  {
    title: {
      type: String,
      required: true,
      trim:true
    },
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const PresetTask = model<TPresetTask>("PresetTask", presetTaskSchema);
