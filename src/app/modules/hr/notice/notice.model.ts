/* eslint-disable @typescript-eslint/no-this-alias */

import { Schema, model } from "mongoose";

import { TNotice } from "./notice.interface";

const noticeSchema = new Schema<TNotice>(
  {
    noticeType: {
      type: String,
      required: true,
    },
    noticeDescription: {
      type: String,
      required: true,
     
    },
    noticeDate: {
      type: Date,
      required: true,
      
    },   
    noticeBy: {
      type: String,
    },
    status: {
      type: String,      
      default: "active",
    },  
   
   
  },
  {
    timestamps: true,
  }
);



export const Notice = model<TNotice>("Notice", noticeSchema);
