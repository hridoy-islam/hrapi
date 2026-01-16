import { Schema, model } from "mongoose";
import { TAdminNotice } from "./noticeAdmin.interface";

const AdminNoticeSchema = new Schema<TAdminNotice>(
  {
    noticeDescription: {
      type: String,
      required: true,
    },
    noticeSetting: {
      type: String,
      enum: ["individual", "all"],
      required: true,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    noticeBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const AdminNotice = model<TAdminNotice>(
  "AdminNotice",
  AdminNoticeSchema
);
