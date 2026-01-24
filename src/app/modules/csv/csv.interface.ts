import mongoose, { Types } from "mongoose";

export interface TCSV {
  companyId: mongoose.Types.ObjectId;
  attendances: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    email:string;
    phone:string;
    name:string;
    note:string;
    duration:Number;
  }[];
}
