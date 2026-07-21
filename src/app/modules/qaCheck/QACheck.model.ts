/* eslint-disable no-unused-vars */
import { Schema, model } from "mongoose";
import { TLogEntry, TQACheck } from "./QACheck.interface";


const LogEntrySchema = new Schema<TLogEntry>(
  {
    title: { type: String },
    date: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    document: [{ type: String }],
    note: { type: String },
    scheduledDate: { 
      type: Date, 
      
    },
     completionDate: { 
      type: Date 
    },
    action: { 
      type: String, 
      enum: ['update', 'close', 'reopen', 'create'] 
    },
    previousStatus: { type: Boolean },
    newStatus: { type: Boolean },
  }
);

const QACheckSchema = new Schema<TQACheck>(
  {
    employeeId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    scheduledDate: { 
      type: Date, 
      
    },

    QACheckNote:{
      type:String
    },
    
    completionDate: { 
      type: Date 
    },

    isClosed:{
      type:Boolean,
      default:false
    },

    logs: [LogEntrySchema],
  },
  { timestamps: true }
);

export const QACheck = model<TQACheck>("QACheck", QACheckSchema);