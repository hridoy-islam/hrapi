import { Types } from "mongoose";
import { TCleaningType } from "../cleaningArea/cleaningArea.interface";

// A copy of the element as it read when the log was submitted, so later
// edits to the area never rewrite a signed log
export interface TCleaningLogItem {
  elementId?: Types.ObjectId;
  element: string;
  performanceParameter: string;
  checked: boolean;
}

// One line of the log's history, e.g. "Mahi submitted cleaning log"
export interface TCleaningLogHistory {
  title: string;
  action: "create" | "update";
  updatedBy?: Types.ObjectId;
  date: Date;
}

export interface TCleaningLog {
  companyId: Types.ObjectId;
  employeeId: Types.ObjectId;
  areaId?: Types.ObjectId;
  areaName: string;
  roomNumber?: string;
  type: TCleaningType;
  items: TCleaningLogItem[];
  signatureUrl: string;
  signedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  logs: TCleaningLogHistory[];
}
