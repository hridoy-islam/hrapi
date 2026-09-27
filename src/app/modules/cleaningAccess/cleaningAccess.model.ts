import { Schema, model } from "mongoose";
import { TCleaningAccess } from "./cleaningAccess.interface";

const CleaningAccessSchema = new Schema<TCleaningAccess>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
    },

    employeeId: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const CleaningAccess = model<TCleaningAccess>(
  "CleaningAccess",
  CleaningAccessSchema
);
