import { Types } from "mongoose";

export interface TScheduleCheck {
  companyId: Types.ObjectId;
  dbsCheckDate: number;
  rtwCheckDate: number;
  passportCheckDate: number;
  visaCheckDate:number;
  appraisalCheckDate:number;
  immigrationCheckDate:number;
  spotCheckDate:number;
  supervisionCheckDate:number;
  disciplinaryCheckDate:number;
  spotCheckDuration:number;
  supervisionDuration:number
  qaCheckDuration:number
  qaCheckDate:number
}
