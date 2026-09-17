import { Types } from "mongoose";

export interface TJobBoard {
  companyId: Types.ObjectId;
  title: string;
  description?: string;
  employeeId: Types.ObjectId[];
  status: "active" | "archived";
}
