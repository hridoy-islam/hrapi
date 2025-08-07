import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { BankHoliday } from "./bank-holiday.model";
import { TBankHoliday } from "./bank-holiday.interface";
import { BankHolidaySearchableFields } from "./bank-holiday.constant";


const getAllBankHolidayFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(BankHoliday.find(), query)
    .search(BankHolidaySearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleBankHolidayFromDB = async (id: string) => {
  const result = await BankHoliday.findById(id);
  return result;
};


const createBankHolidayIntoDB = async (payload: TBankHoliday) => {
    try {
      
      const result = await BankHoliday.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createBankHolidayIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create BankHoliday");
    }
  };


const updateBankHolidayIntoDB = async (id: string, payload: Partial<TBankHoliday>) => {
  const bankHoliday = await BankHoliday.findById(id);

  if (!bankHoliday) {
    throw new AppError(httpStatus.NOT_FOUND, "BankHoliday not found");
  }


  const result = await BankHoliday.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};
const deleteBankHolidayIntoDB = async (id: string) => {
  const bankHoliday = await BankHoliday.findById(id);

  if (!bankHoliday) {
    throw new AppError(httpStatus.NOT_FOUND, "BankHoliday not found");
  }


  const result = await BankHoliday.findByIdAndDelete(id,  {
    new: true,
    runValidators: true,
  });

  return result;
};


export const BankHolidayServices = {
    getAllBankHolidayFromDB,
    getSingleBankHolidayFromDB,
    updateBankHolidayIntoDB,
    createBankHolidayIntoDB,
    deleteBankHolidayIntoDB
  
};



  