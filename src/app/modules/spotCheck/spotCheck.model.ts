/* eslint-disable no-unused-vars */
import { Schema, model } from "mongoose";
import { TLogEntry, TSpotCheck } from "./spotCheck.interface";


const LogEntrySchema = new Schema<TLogEntry>(
  {
    title: { type: String },
    date: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    document: [{ type: String }],
    note: { type: String },
  }
);

const SpotCheckSchema = new Schema<TSpotCheck>(
  {
    employeeId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    scheduledDate: { 
      type: Date, 
      
    },

    spotCheckNote:{
      type:String
    },
    
    completionDate: { 
      type: Date 
    },

    logs: [LogEntrySchema],
  },
  { timestamps: true }
);

export const SpotCheck = model<TSpotCheck>("SpotCheck", SpotCheckSchema);