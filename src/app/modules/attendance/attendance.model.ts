/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TAttendance } from "./attendance.interface";
import { string } from "zod";

const historySchema = new Schema(
  {
    message: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);


const breakLogSchema = new Schema(
  {
    breakStart: { 
      type: String, 
    },
    breakStartDate: { 
      type: String 
    },
    breakEnd: { 
      type: String 
    },
    breakEndDate: { 
      type: String 
    },

    duration: {
      type: Number,
      default: 0
    },

  },
  { timestamps: true }
);

const attendanceSchema = new Schema<TAttendance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    serviceUserId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceUser",
    },
    rotaId: {
      type: Schema.Types.ObjectId,
      ref: "Rota",
    },
    visitorName: {
      type: String,
    },
    visitorPhone: {
      type: String,
    },
    visitReason: {
      type: String,
    },
    userType: {
      type: String,
      enum: ["employee", "service_user", "visitor"],
      default: "employee",
    },

    clockIn: { type: String },
    clockInDate: { type: String },
    clockOut: { type: String },
    clockOutDate: { type: String },

    status: {
      type: String,
      enum: ["clockin", "clockout", "completed", "absent"],
      default: "clockin",
    },

    totalDuration: {
      type: Number,
      default: 0,
    },
    clockType: {
      type: String,
      enum: ["face", "qr", "pin", "manual"],
    },
    source: {
      type: String,
      enum: ["accessControl", "desktopApp", "mobileApp"],
    },
    deviceId: { type: String },
    location: { type: String },
    notes: { type: String },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    history: [historySchema],
    breakLogs: [breakLogSchema],
  },
  {
    timestamps: true,
  },
);

export const Attendance = model<TAttendance>("Attendance", attendanceSchema);
