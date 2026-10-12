import { Schema, model } from "mongoose";
import {
  TCleaningLog,
  TCleaningLogHistory,
  TCleaningLogItem,
  TCleaningLogSession,
} from "./cleaningLog.interface";
import {
  CLEANING_LOG_STATUSES,
  CLEANING_TYPES,
} from "../cleaningArea/cleaningArea.constant";

const CleaningLogItemSchema = new Schema<TCleaningLogItem>(
  {
    elementId: { type: Schema.Types.ObjectId, ref: "CleaningElement" },
    element: { type: String, required: true, trim: true },
    performanceParameter: { type: String, trim: true, default: "" },
    checked: { type: Boolean, default: false },
  },
  { _id: false }
);

const CleaningLogSessionSchema = new Schema<TCleaningLogSession>(
  {
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
  },
  { _id: false }
);

const CleaningLogHistorySchema = new Schema<TCleaningLogHistory>({
  title: { type: String, required: true },
  action: {
    type: String,
    enum: ["create", "update", "start", "pause", "resume", "stop"],
    required: true,
  },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now },
});

const CleaningLogSchema = new Schema<TCleaningLog>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    employeeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    areaId: {
      type: Schema.Types.ObjectId,
      ref: "CleaningArea",
    },

    areaName: {
      type: String,
      required: true,
      trim: true,
    },

    roomNumber: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: CLEANING_TYPES,
      required: true,
    },

    // Logs saved before sessions existed have none and read as completed.
    // No default on purpose: Mongoose fills defaults in when it reads a
    // document, which would turn every old log into "in_progress". The
    // start action always sets it.
    status: {
      type: String,
      enum: CLEANING_LOG_STATUSES,
    },

    periodKey: {
      type: String,
    },

    items: {
      type: [CleaningLogItemSchema],
      default: [],
    },

    sessions: {
      type: [CleaningLogSessionSchema],
      default: [],
    },

    durationSeconds: {
      type: Number,
      default: 0,
    },

    // Required on completion, checked by the service
    signatureUrl: {
      type: String,
    },
    note: {
      type: String,
    },
    // When the signature was given
    signedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    // UK clock times of the first start and of the stop, as HH:MM
    startTime: {
      type: String,
      trim: true,
    },

    endTime: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Written by the service on every create and edit, never by the request
    logs: {
      type: [CleaningLogHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

CleaningLogSchema.index({ companyId: 1, createdAt: -1 });
CleaningLogSchema.index({ employeeId: 1, createdAt: -1 });
// One log per area per day (daily) or month (monthly), whatever its status.
// Older logs have no periodKey and stay out of it.
CleaningLogSchema.index(
  { areaId: 1, periodKey: 1 },
  { unique: true, partialFilterExpression: { periodKey: { $exists: true } } }
);

export const CleaningLog = model<TCleaningLog>(
  "CleaningLog",
  CleaningLogSchema
);
