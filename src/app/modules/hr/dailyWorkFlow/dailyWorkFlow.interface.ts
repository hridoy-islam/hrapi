import { Types } from "mongoose";

export type TDailyWorkFlowTask = {
  taskName: string;
  startTime: string;
  endTime: string;
  note?: string;
};

export type TDailyWorkFlow = {
  employeeId: Types.ObjectId;
  companyId: Types.ObjectId;
  date: Date;
  tasks: TDailyWorkFlowTask[];
};
