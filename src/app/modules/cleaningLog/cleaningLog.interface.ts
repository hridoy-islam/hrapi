import { Types } from "mongoose";
import { TCleaningType } from "../cleaningArea/cleaningArea.interface";

// A copy of the element as it read when the log was started, so later
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
  action: "create" | "update" | "start" | "pause" | "resume" | "stop";
  updatedBy?: Types.ObjectId;
  date: Date;
}

// One stretch of work, from a start or resume to a pause or stop
export interface TCleaningLogSession {
  startedAt: Date;
  endedAt?: Date;
}

export type TCleaningLogStatus =
  | "in_progress"
  | "paused"
  | "stopped"
  | "completed";

export interface TCleaningLog {
  companyId: Types.ObjectId;
  employeeId: Types.ObjectId;
  areaId?: Types.ObjectId;
  areaName: string;
  roomNumber?: string;
  type: TCleaningType;
  status: TCleaningLogStatus;
  // The day or month the log covers, see cleaningPeriodKey
  periodKey?: string;
  items: TCleaningLogItem[];
  sessions: TCleaningLogSession[];
  // Time worked across the closed sessions
  durationSeconds: number;
  signatureUrl?: string;
  signedAt?: Date;
  note?: string;
  // UK clock times (HH:MM) of the start and the end: stamped by the timer
  // or typed in by hand. Both are required on completion.
  startTime?: string;
  endTime?: string;
  completedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  logs: TCleaningLogHistory[];
}
