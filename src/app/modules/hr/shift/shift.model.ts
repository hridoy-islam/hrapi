import { Schema, model } from "mongoose";
import { TShift } from "./shift.interface";

const shiftSchema = new Schema<TShift>(
  {
    name: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  }
);

export const Shift = model<TShift>("Shift", shiftSchema);
