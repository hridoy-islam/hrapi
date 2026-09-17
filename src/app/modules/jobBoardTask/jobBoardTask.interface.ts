import { Types } from "mongoose";

export interface TJobBoardTask {
  companyId: Types.ObjectId;
  jobBoardId: Types.ObjectId;
  taskName: string;
  taskDate: Date;
  documents?: string[];
  note?: string;
  taskDoneBy?: Types.ObjectId[];
  completedBy?: Types.ObjectId;
  completedAt?: Date;
  isCompleted: boolean;
}
