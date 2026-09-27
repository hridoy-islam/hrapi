import { Schema, model } from "mongoose";
import {
  TCleaningLog,
  TCleaningLogHistory,
  TCleaningLogItem,
} from "./cleaningLog.interface";
import { CLEANING_TYPES } from "../cleaningArea/cleaningArea.constant";

const CleaningLogItemSchema = new Schema<TCleaningLogItem>(
  {
    elementId: { type: Schema.Types.ObjectId, ref: "CleaningElement" },
    element: { type: String, required: true, trim: true },
    performanceParameter: { type: String, trim: true, default: "" },
    checked: { type: Boolean, default: false },
  },
  { _id: false }
);

const CleaningLogHistorySchema = new Schema<TCleaningLogHistory>({
  title: { type: String, required: true },
  action: { type: String, enum: ["create", "update"], required: true },
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

    items: {
      type: [CleaningLogItemSchema],
      default: [],
    },

    signatureUrl: {
      type: String,
      required: true,
    },

    // When the signature was given
    signedAt: {
      type: Date,
      required: true,
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
  }
);

CleaningLogSchema.index({ companyId: 1, createdAt: -1 });
CleaningLogSchema.index({ employeeId: 1, createdAt: -1 });

export const CleaningLog = model<TCleaningLog>(
  "CleaningLog",
  CleaningLogSchema
);
