/* eslint-disable no-unused-vars */
import { Types } from "mongoose";

export interface TSickNote {
  note: string;
  startDate: Date;
  endDate: Date;
  employeeId: Types.ObjectId;
  companyId: Types.ObjectId;
  documents: [string];
}
