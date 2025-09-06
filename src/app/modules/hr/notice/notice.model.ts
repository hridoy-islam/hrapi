import { Schema, model } from "mongoose";
import { TNotice } from "./notice.interface";

const noticeSchema = new Schema<TNotice>(
  {
    noticeType: {
      type: String,
      required: true,
    },
    noticeDescription: {
      type: String,
      required: true,
    },
    noticeSetting: {
      type: String,
      enum: ["department", "designation", "individual", "all"],
      required: true,
    },
    department: {
      type: [ { type: Schema.Types.ObjectId, ref: "Department" }],
      default: [],
    },
    designation: {
      type: [{type: Schema.Types.ObjectId, ref: "Designation"}],
      default: [],
    },
    users: {
      type: [{type: Schema.Types.ObjectId, ref: "User"}],
      default: [],
    },
    noticeBy: {
       type: Schema.Types.ObjectId, ref: "User",
    },
    status: {
      type: String,
      default: "active",
    },
    noticeDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Notice = model<TNotice>("Notice", noticeSchema);
