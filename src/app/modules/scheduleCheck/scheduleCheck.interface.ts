import { Types } from "mongoose";

export interface TScheduleCheck {
  companyId: Types.ObjectId;
  dbsCheckDate: number;
  rtwCheckDate: number;
  passportCheckDate: number;
  visaCheckDate:number;
  appraisalCheckDate:number;
  immigrationCheckDate:number;
}
