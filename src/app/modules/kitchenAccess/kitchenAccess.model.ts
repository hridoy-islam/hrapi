import { Schema, model } from "mongoose";
import { TKitchenAccess } from "./kitchenAccess.interface";

const KitchenAccessSchema = new Schema<TKitchenAccess>(
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

export const KitchenAccess = model<TKitchenAccess>(
  "KitchenAccess",
  KitchenAccessSchema
);
