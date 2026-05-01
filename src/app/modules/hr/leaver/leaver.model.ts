import { model, Schema } from "mongoose";
import { TLeaver } from "./leaver.interface";

const LeaverSchema = new Schema<TLeaver>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User", 
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    note: {
      type: String,
      trim: true,
    },
    leavingReason: {
      type: String,
      trim: true,
    },
    terminationDate: {
      type: Date,
    },
    dissmissalReason: {
      type: String,
      trim: true,
    },
    documents:[ {
      type: String,
      
    }],
  },
  {
    timestamps: true,
  }
);

export const Leaver = model<TLeaver>("Leaver", LeaverSchema);