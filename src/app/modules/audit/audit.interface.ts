import { Types } from "mongoose";

export interface TLogEntry {
  title: string;
  date: Date;
  updatedBy: Types.ObjectId;
  document?: string[];
  note?: string;
  auditDate?: Date;
    nextCheckDate:Date;

  extendDeadline?: Date;
  action?: 'update' | 'create' | 'extend' | 'complete';
  previousStatus?: boolean;
  newStatus?: boolean;
}

export interface TAudit {
   companyId: Types.ObjectId;
  auditTypeId: Types.ObjectId;
  employeeId: Types.ObjectId;
  serviceUserId: Types.ObjectId;
  note:string;
    document?: string[];

  auditDate:Date;
  nextCheckDate:Date;
  extendDeadline:Date;
  logs: TLogEntry[];
  action?: string;
  status: 'active' | 'completed';
}
