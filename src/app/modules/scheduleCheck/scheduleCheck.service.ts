import httpStatus from "http-status";


import { ScheduleCheck } from "./scheduleCheck.model";
import { TScheduleCheck } from "./scheduleCheck.interface";
import { ScheduleCheckSearchableFields } from "./scheduleCheck.constant";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";


const getAllScheduleCheckFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(ScheduleCheck.find(), query)
    .search(ScheduleCheckSearchableFields)
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

const getSingleScheduleCheckFromDB = async (id: string) => {
  const result = await ScheduleCheck.findById(id);
  return result;
};


const createScheduleCheckIntoDB = async (payload: TScheduleCheck) => {
    try {
      
      const result = await ScheduleCheck.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createScheduleCheckIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create ScheduleCheck");
    }
  };


const updateScheduleCheckIntoDB = async (id: string, payload: Partial<TScheduleCheck>) => {
  const scheduleCheck = await ScheduleCheck.findById(id);

  if (!scheduleCheck) {
    throw new AppError(httpStatus.NOT_FOUND, "ScheduleCheck not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await ScheduleCheck.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteScheduleCheckFromDB = async (id: string) => {
  const scheduleCheck = await ScheduleCheck.findById(id);

  if (!scheduleCheck) {
    throw new AppError(httpStatus.NOT_FOUND, "ScheduleCheck not found");
  }

  await ScheduleCheck.findByIdAndDelete(id);

  return { message: "ScheduleCheck deleted successfully" };
};



export const ScheduleCheckServices = {
    getAllScheduleCheckFromDB,
    getSingleScheduleCheckFromDB,
    updateScheduleCheckIntoDB,
    createScheduleCheckIntoDB,
    deleteScheduleCheckFromDB
  
};



  