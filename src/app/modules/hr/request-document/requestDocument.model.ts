import { Schema, model, Types } from "mongoose";
import { TRequestDocument } from "./requestDocument.interface";

const RequestDocumentSchema = new Schema<TRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    startDate: { type: Date },
    endDate: { type: Date },
    document: { type: String },
    requestDate:{ type: Date },
    documentType: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const RequestDocument = model<TRequestDocument>(
  "RequestDocument",
  RequestDocumentSchema
);
