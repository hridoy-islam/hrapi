import { Types } from "mongoose";

export interface TLogEntry {
  title: string;
  date: Date; // ISO string or formatted date
  updatedBy: string;
  note:string;
  documents:string[];
  Acknowledgement:any[];
}

export interface TMeetingMins {
  companyId: Types.ObjectId;
  employeeId: Types.ObjectId[];
  nextMeetingDate?: Date;
  title:string;
  logs?: TLogEntry[];
}
