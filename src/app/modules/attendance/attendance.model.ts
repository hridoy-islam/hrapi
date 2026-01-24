/* eslint-disable @typescript-eslint/no-this-alias */

import { Schema, model } from "mongoose";

import { TAttendance } from "./attendance.interface";

const attendanceSchema = new Schema<TAttendance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: "Shift",
    },
    startDate: {
      type: String,
    },
    startTime: {
      type: String,
    },
    endDate: {
      type: String,
    },
    endTime: {
      type: String,
    },
    eventType: {
      type: String,
      enum: ["clock_in", "clock_out", "manual"],
    },
    clockType: {
      type: String,
      enum: ["face", "qr", "pin", "manual"],
    },
    source: {
      type: String,
      enum: ["accessControl", "desktopApp", "mobileApp"],
    },
    deviceId: {
      type: String,
    },
    approvalRequired: {
      type: Boolean,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
    duration:{
      type:Number,
    },
    breakTimes: [
      {
        breakStart: { type: Date },
        breakEnd: { type: Date },
      },
    ],
    screenshots: [
      {
        url: { type: String },
        capturedAt: { type: Date, default: Date.now },
      },
    ],
    timestamp: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const Attendance = model<TAttendance>("Attendance", attendanceSchema);
