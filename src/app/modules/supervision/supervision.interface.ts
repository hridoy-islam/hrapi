/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';


export interface TLogEntry {
  title: string;
  date: Date; // ISO string or formatted date
  updatedBy: string;
  
}

export interface TSupervision {
  userId: Types.ObjectId;
  dbsDocumentUrl: string;
  disclosureNumber: string;
  dateOfIssue: Date;
  expiryDate: Date;
  logs?: TLogEntry[];
}