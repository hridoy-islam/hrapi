import { Schema, model } from "mongoose";
import { TPayslipDoc } from "./payslipDoc.interface";

const PayslipDocSchema = new Schema<TPayslipDoc>(
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
      ref: "PayslipDoc", 
      default: null 
    },
    // REMOVED 'default: null' here so it properly defaults to a clean, empty array []
    ancestors: [
      { 
        type: Schema.Types.ObjectId, 
        ref: "PayslipDoc" 
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
PayslipDocSchema.index({ companyId: 1, parentId: 1 });
PayslipDocSchema.index({ ancestors: 1 });

export const PayslipDoc = model<TPayslipDoc>("PayslipDoc", PayslipDocSchema);