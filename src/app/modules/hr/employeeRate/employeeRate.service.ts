import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { EmployeeRate } from "./employeeRate.model";
import { TEmployeeRate } from "./employeeRate.interface";
import { EmployeeRateSearchableFields } from "./employeeRate.constant";


const getAllEmployeeRateFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    EmployeeRate.find().populate("shiftId"),
    query
  )
    .search(EmployeeRateSearchableFields)
    .filter()
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

const getSingleEmployeeRateFromDB = async (id: string) => {
  const result = await EmployeeRate.findById(id).populate("shiftId"); 
  return result;
};


const createEmployeeRateIntoDB = async (payload: TEmployeeRate) => {
    try {
      
      const result = await EmployeeRate.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createEmployeeRateIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create EmployeeRate");
    }
  };


const updateEmployeeRateIntoDB = async (id: string, payload: Partial<TEmployeeRate>) => {
  const employeeRate = await EmployeeRate.findById(id);

  if (!employeeRate) {
    throw new AppError(httpStatus.NOT_FOUND, "EmployeeRate not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await EmployeeRate.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteEmployeeRateFromDB = async (id: string) => {
  const employeeRate = await EmployeeRate.findById(id);

  if (!employeeRate) {
    throw new AppError(httpStatus.NOT_FOUND, "EmployeeRate not found");
  }

  await EmployeeRate.findByIdAndDelete(id);

  return { message: "EmployeeRate deleted successfully" };
};



export const EmployeeRateServices = {
    getAllEmployeeRateFromDB,
    getSingleEmployeeRateFromDB,
    updateEmployeeRateIntoDB,
    createEmployeeRateIntoDB,
    deleteEmployeeRateFromDB
  
};



  