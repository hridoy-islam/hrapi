/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';


export interface TLogEntry {
  title: string;
  date: Date; 
  updatedBy: Types.ObjectId;
  document?: string; 

}

export interface TInduction {
  employeeId: Types.ObjectId;
  inductionDate: Date; 
  action:string;
  logs: TLogEntry[];
  noPromotion:boolean;
  createdAt?: Date;
  updatedAt?: Date;
}