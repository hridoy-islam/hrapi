/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";
export interface TLogEntry {
  title: string;
  date: Date; // ISO string or formatted date
  updatedBy: string;
  document: string;
}

export interface TPassport {
  userId: Types.ObjectId;
  passportNumber: string;
  passportExpiryDate: Date;

  logs?: TLogEntry[];
}
