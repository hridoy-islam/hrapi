import { Types } from "mongoose";

export interface TBankHoliday {
  _id: Types.ObjectId;
  title: string;
  date: Date; 
  year: number;
      companyId: Types.ObjectId;

}
