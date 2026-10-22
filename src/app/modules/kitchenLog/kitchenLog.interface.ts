import { Types } from "mongoose";
import {
  TKitchenFrequency,
  TKitchenModule,
  TKitchenShift,
} from "./kitchenLog.constant";

export type TKitchenLogStatus = "in_progress" | "stopped" | "completed";

// One line of the log's history, e.g. "Mahi completed Larder Deep Clean"
export interface TKitchenLogHistory {
  title: string;
  action: "start" | "stop" | "complete" | "create" | "update" | "approve";
  updatedBy?: Types.ObjectId;
  date: Date;
}

// Fields every kitchen log has, whatever its module
export interface TKitchenLog {
  companyId: Types.ObjectId;
  employeeId: Types.ObjectId;
  module: TKitchenModule;
  frequency: TKitchenFrequency;
  status: TKitchenLogStatus;
  // The day the log covers; the period is worked out from it
  logDate: Date;
  // Unique per company and module, e.g. 2026-10-22#morning or 2026-W43#floor
  periodKey: string;
  // UK clock times (HH:MM) of the start and the end
  startTime?: string;
  endTime?: string;
  startedAt?: Date;
  stoppedAt?: Date;
  durationSeconds: number;
  signatureUrl?: string;
  signedAt?: Date;
  note?: string;
  completedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  logs: TKitchenLogHistory[];
}

// Management sign off, on the modules that need it
export interface TKitchenApproval {
  approvedBy?: Types.ObjectId;
  approvalSignature?: string;
  approvedAt?: Date;
  approvalComment?: string;
}

export interface TKitchenChecklistItem {
  key: string;
  label: string;
  checked: boolean;
}

export interface TKitchenReading {
  key: string;
  label: string;
  value: string;
}

export interface TKitchenCleaningLog extends TKitchenLog {
  shift: TKitchenShift;
  checklist: TKitchenChecklistItem[];
  readings: TKitchenReading[];
}

export interface TKitchenDeepCleanLog extends TKitchenLog, TKitchenApproval {
  area: string;
}

export interface TEquipmentTemperature {
  key: string;
  label: string;
  range: string;
  time?: string;
  temperature?: number;
  outOfRange: boolean;
  reportedToManagement: boolean;
}

export interface TEquipmentTemperatureLog extends TKitchenLog {
  area: string;
  temperatures: TEquipmentTemperature[];
}

// Larder, servery and mini kitchen deep clean: one item per log
export interface TItemDeepCleanLog extends TKitchenLog, TKitchenApproval {
  itemKey: string;
  item: string;
  action: string;
  itemFrequency: string;
}

export interface TProbeCalibrationLog extends TKitchenLog {
  probeDetails?: string;
  icedWaterReading?: number;
  boilingWaterReading?: number;
  icedWaterInRange?: boolean;
  boilingWaterInRange?: boolean;
}
