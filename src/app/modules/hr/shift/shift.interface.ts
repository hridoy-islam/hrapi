import { Types } from "mongoose";

export interface TShift {
  companyId: Types.ObjectId;

  name: string;
  startTime: string;
  endTime: string;
}
