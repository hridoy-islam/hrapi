import mongoose, { model, Schema } from "mongoose";

import { string } from "zod";
import { TDesignation } from "./designation.interface";

const designationSchema = new Schema<TDesignation>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    permissions: {
      type: Map,
      of: new mongoose.Schema({
        canView: { type: Boolean, default: false },
        canCreate: { type: Boolean, default: false },
        canEdit: { type: Boolean, default: false },
        canDelete: { type: Boolean, default: false },
      }),
      
    }
  },
  {
    timestamps: true,
  }
);

export const Designation = model<TDesignation>("Designation", designationSchema);
