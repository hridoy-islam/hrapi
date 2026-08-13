import { Schema, model } from "mongoose";
import { TAudit, TLogEntry } from "./audit.interface";

const LogEntrySchema = new Schema<TLogEntry>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    document: {
      type: [String],
      default: [],
    },
    note: {
      type: String,
      trim: true,
    },
    auditDate: {
      type: Date,
    },
    nextCheckDate:{
            type: Date,

    },
    extendDeadline: {
      type: Date,
    },
    action: {
      type: String,
      enum: ["update", "create", "extend", "complete"],
    },
    previousStatus: {
      type: Boolean,
    },
    newStatus: {
      type: Boolean,
    },
  },
  { _id: true }
);

const AuditSchema = new Schema<TAudit>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    auditTypeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "AuditType",
    },

    employeeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    serviceUserId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ServiceUser",
    },

    note: {
      type: String,
      trim: true,
    },

    document: {
      type: [String],
      default: [],
    },

    auditDate: {
      type: Date,
    },

    nextCheckDate: {
      type: Date,
    },

    extendDeadline: {
      type: Date,
    },

    logs: {
      type: [LogEntrySchema],
      default: [],
    },

    action: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const Audit = model<TAudit>("Audit", AuditSchema);