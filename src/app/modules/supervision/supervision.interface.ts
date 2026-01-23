/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';


export interface TLogEntry {
  title: string;
  date: Date; 
  updatedBy: Types.ObjectId;
  document:string;
  note?:string;
  
}

export interface TSupervision {
 employeeId: Types.ObjectId;
   scheduledDate: Date; 
   completionDate?: Date;
   sessionNote?:string;
   logs: TLogEntry[];
   createdAt?: Date;
   updatedAt?: Date;
}