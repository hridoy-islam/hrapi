/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';


export interface TLogEntry {
  title: string;
  date: Date; 
  scheduledDate?: Date;
  completionDate?: Date;
  updatedBy: Types.ObjectId;
  document?: string;
  note?:string;
  action?: 'update' | 'close' | 'reopen' | 'create';
  previousStatus?: boolean;
  newStatus?: boolean;
}

export interface TSupervision {
 employeeId: Types.ObjectId;
   scheduledDate: Date; 
   completionDate?: Date;
   sessionNote?:string;
   logs: TLogEntry[];
     isClosed:Boolean;

   createdAt?: Date;
   updatedAt?: Date;
}