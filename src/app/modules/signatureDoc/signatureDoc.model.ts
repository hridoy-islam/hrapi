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
  default: null 
},
    signedDocument: {
      type: String,
    },

    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    status:{
      type:String,
      enum:['pending','completed', 'submitted', 'rejected'],
      default:'pending'
    },
    submittedAt:{
      type:Date
    }
  },
  {
    timestamps: true,
  },
);

export const SignatureDoc = model<TSignatureDoc>(
  "SignatureDoc",
  SignatureDocSchema,
);
