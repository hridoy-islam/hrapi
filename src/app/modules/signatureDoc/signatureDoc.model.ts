import { Schema, model } from "mongoose";
import { TSignatureDoc } from "./signatureDoc.interface";

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
    approverIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    signedByApprovers: [{ type: Schema.Types.ObjectId, ref: "User" }],
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
