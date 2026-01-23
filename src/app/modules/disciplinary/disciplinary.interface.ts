/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';


export interface TLogEntry {
  title: string;
  date: Date; 
  updatedBy: Types.ObjectId;
  document?: string; 
note:string
}

export interface TDisciplinary {
  employeeId: Types.ObjectId;
  issueDeadline: Date; 
  extendDeadline: Date; 
  issueDocument:string;
  issueNote:string;
  action: string;
  logs: TLogEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}