import { Schema, model } from "mongoose";
import { TAudit } from "./audit.interface";

const AuditSchema = new Schema<TAudit>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentTitle: {
      type: String,
      required: true,
    },
    title: [
      {
        type: String,
        required: true,
      },
    ],
    type: { type: String, enum: ["folder", "file"], required: true },
    parentId: { 
      type: Schema.Types.ObjectId, 
      ref: "Audit", 
      default: null 
    },
    // REMOVED 'default: null' here so it properly defaults to a clean, empty array []
    ancestors: [
      { 
        type: Schema.Types.ObjectId, 
        ref: "Audit" 
      }
    ],
    documentUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// CRITICAL INDEXES: This speeds up searching folders drastically
AuditSchema.index({ companyId: 1, parentId: 1 });
AuditSchema.index({ ancestors: 1 });

export const Audit = model<TAudit>("Audit", AuditSchema);