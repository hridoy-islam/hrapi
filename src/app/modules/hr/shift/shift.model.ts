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
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  }
);

export const Shift = model<TShift>("Shift", shiftSchema);
