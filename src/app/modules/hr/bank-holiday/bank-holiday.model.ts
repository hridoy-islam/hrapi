import mongoose, { model, Schema } from "mongoose";

import { string } from "zod";
import { TBankHoliday } from "./bank-holiday.interface";

const BankHolidaySchema = new Schema<TBankHoliday>({
  title: {
    type: String,
  },
  date: {
    type: Date,
  },
  year: {
    type: Number,
  },
     companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
});

export const BankHoliday = model<TBankHoliday>(
  "BankHoliday",
  BankHolidaySchema
);
