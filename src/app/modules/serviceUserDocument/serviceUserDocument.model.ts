import { Schema, model } from "mongoose";
import { TServiceUserDocument } from "./serviceUserDocument.interface";

const ServiceUserDocumentSchema = new Schema<TServiceUserDocument>(
  {
    serviceUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentTitle: {
      type: String,
      required: true,
    },
    documentUrl: [{
      type: String,
      required: true,
    }],
    note:{
      type: String
    }
  },
  {
    timestamps: true,
  }
);

export const ServiceUserDocument = model<TServiceUserDocument>(
  "ServiceUserDocument",
  ServiceUserDocumentSchema
);
