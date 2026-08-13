import { Schema, model } from "mongoose";
import { TAuditType } from "./auditType.interface";

const AuditTypeSchema = new Schema<TAuditType>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  title:{
    type:String,
    required:true
  },
  status:{
    type:String,
    required:true,
    enum:['active','inactive'],
    default:"active"
  }
  
  },
  {
    timestamps: true,
  }
);

export const AuditType = model<TAuditType>(
  "AuditType",
  AuditTypeSchema
);
