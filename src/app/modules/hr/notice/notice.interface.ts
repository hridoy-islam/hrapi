/* eslint-disable no-unused-vars */
import mongoose, {  Types } from "mongoose";


export interface TNotice {
  noticeType: "general" | "urgent" | "reminder" | "event" | "other";
  noticeDescription: string;
  noticeSetting: "department" | "designation" | "individual" | "all";
  department?:mongoose.Types.ObjectId;  
  designation?:mongoose.Types.ObjectId[]; 
  users?: mongoose.Types.ObjectId[];       
  noticeBy?: string;      
  status?: "active" | "inactive"; 
  noticeDate?: Date;       
  createdAt?: Date;       
}

