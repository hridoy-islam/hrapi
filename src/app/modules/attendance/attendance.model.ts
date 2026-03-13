/* eslint-disable @typescript-eslint/no-this-alias */

import { Schema, model } from "mongoose";

import { TAttendance } from "./attendance.interface";


const AttendanceLogSchema = new Schema(
  {
    clockIn: { type: String },
    clockInDate: { type: String },
    clockOut: { type: String },
    clockOutDate: { type: String },

  },
  { _id: true }
);

const attendanceSchema = new Schema<TAttendance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    rotaId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Rota",
    },
    date: {
      type: String, 
      required: true,
    },
    status: {
      type: String,
      enum: ["clockin", "clockout", "completed", "absent"],
      default: "clockin",
    },
    attendanceLogs: {
      type: [AttendanceLogSchema],
      default: [],
    },
    totalDuration: {
      type: Number, // Total minutes worked across all logs in this shift
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
  },
  {
    timestamps: true,
  }
);


export const Attendance = model<TAttendance>("Attendance", attendanceSchema);
