import { Schema, model } from "mongoose";
import { TSignatureDoc } from "./signatureDoc.interface";

const SignedSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
const ForwardSchema = new Schema(
  {
    index: {
      type: Number,
      required: true,
      default: 0,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const SignatureDocSchema = new Schema<TSignatureDoc>(
  {
    content: {
      type: String,
      required: true,
    },
    document: {
      type: String,
      required: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    envelopeId: {
      type: String,
      default: null,
    },
    approverIds: [ForwardSchema],
    signedBy: [SignedSchema],
    signedDocument: {
      type: String,
    },

    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "submitted", "rejected", "forwarded"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const SignatureDoc = model<TSignatureDoc>(
  "SignatureDoc",
  SignatureDocSchema,
);
