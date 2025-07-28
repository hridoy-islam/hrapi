import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { Shift } from "./shift.model";
import { TShift } from "./shift.interface";
import { ShiftSearchableFields } from "./shift.constant";


const getAllShiftFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(Shift.find(), query)
    .search(ShiftSearchableFields)
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

const getSingleShiftFromDB = async (id: string) => {
  const result = await Shift.findById(id);
  return result;
};


const createShiftIntoDB = async (payload: TShift) => {
    try {
      
      const result = await Shift.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createShiftIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Shift");
    }
  };


const updateShiftIntoDB = async (id: string, payload: Partial<TShift>) => {
  const notice = await Shift.findById(id);

  if (!notice) {
    throw new AppError(httpStatus.NOT_FOUND, "Shift not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await Shift.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteShiftFromDB = async (id: string) => {
  const shift = await Shift.findById(id);

  if (!shift) {
    throw new AppError(httpStatus.NOT_FOUND, "Shift not found");
  }

  await Shift.findByIdAndDelete(id);

  return { message: "Shift deleted successfully" };
};



export const ShiftServices = {
    getAllShiftFromDB,
    getSingleShiftFromDB,
    updateShiftIntoDB,
    createShiftIntoDB,
    deleteShiftFromDB
  
};



  