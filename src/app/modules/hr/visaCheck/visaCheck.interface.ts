import { Types } from "mongoose";

export interface TLogEntry {
  title: string;
  date: Date; // ISO string or formatted date
  updatedBy: string;
}

export interface TVisaCheck {
  employeeId: Types.ObjectId;
  startDate: Date;
  expiryDate: Date;
  status?: string;
  documents: string[];
  logs?: TLogEntry[];
}
