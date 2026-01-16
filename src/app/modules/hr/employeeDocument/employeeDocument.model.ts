import { Schema, model } from "mongoose";
import { TEmployeeDocument } from "./employeeDocument.interface";

const EmployeeDocumentSchema = new Schema<TEmployeeDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentTitle: {
      type: String,
      required: true,
    },
    documentUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const EmployeeDocument = model<TEmployeeDocument>(
  "EmployeeDocument",
  EmployeeDocumentSchema
);
