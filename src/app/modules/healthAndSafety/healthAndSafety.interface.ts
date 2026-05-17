/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";

export interface TLogEntry {
  title?: string;
  date?: Date;
  updatedBy?: Types.ObjectId;
  document?: string[];
}

export interface THealthAndSafety {
  companyId: Types.ObjectId;
  title?: string;
  startDate?: Date;
  expiryDate?: Date;
  document?: string[];

  logs?: TLogEntry[];
}

