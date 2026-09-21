import { Types } from "mongoose";

export type TJobBoardTaskLogAction =
  | "create"
  | "update"
  | "complete"
  | "reopen";

// One changed field, already formatted so the UI can print it as it stands
export interface TJobBoardTaskLogChange {
  field: string;
  from?: string;
  to?: string;
}

export interface TJobBoardTaskLog {
  title: string;
  date: Date;
  updatedBy?: Types.ObjectId;
  action: TJobBoardTaskLogAction;
  changes?: TJobBoardTaskLogChange[];
  taskDoneBy?: Types.ObjectId[];
  note?: string;
  documents?: string[];
  remarks?: string;
  figure?: string;
  concernPartyName?: string;
  others?: string;
}

export interface TJobBoardTask {
  companyId: Types.ObjectId;
  jobBoardId: Types.ObjectId;
  taskName: string;
  taskDate: Date;
  documents?: string[];
  note?: string;
  remarks?: string;
  figure?: string;
  concernPartyName?: string;
  others?: string;
  taskDoneBy?: Types.ObjectId[];
  completedBy?: Types.ObjectId;
  completedAt?: Date;
  isCompleted: boolean;
  logs: TJobBoardTaskLog[];
}
