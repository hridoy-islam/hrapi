/* eslint-disable no-unused-vars */
import {  Types } from "mongoose";


export interface TNotice {
  _id: Types.ObjectId;
  noticeType: string;  
  noticeDescription: string;
  noticeDate: Date;
  noticeBy: string; 
  status: string; 
}

